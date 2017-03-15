'use strict';

module.exports = function (Group) {

  /* * * * * * * * * * * * * * * * * * * * * * * * * * */
  /*           O P E R A T I O N   H O O K S           */
  /* * * * * * * * * * * * * * * * * * * * * * * * * * */

  /** This operation hook checks if the requesting user is a member
   *  of the group he wants to change or an admin. If neither of both,
   *  the operation is rejected.
   */
  Group.observe('before save', function (context, next) {

    var currentInstance = null;
    if (context.currentInstance) {
      currentInstance = context.currentInstance;
    }
    if (context.instance) {
      currentInstance = context.instance;
    }

    var app = Group.app;

    var token = context.options && context.options.accessToken;

    // Context is null when model is accessed via node. We only
    // want to restrict access for users of the REST API.
    //
    // For some reason, context is not null when accessing model
    // from remote method in the same model. The key of the field
    // containing the current instance gives us a clue whether this
    // request comes via REST or via node.
    if (token == undefined || context.currentInstance) {
      // We're accessing via node
      next();
    } else {
      // Access via REST
      // Get current user and group

      var userId = token.userId;
      var contextGroup = currentInstance;
      // If a new instance is saved the currentInstance is used in checkMembers
      if (context.isNewInstance) {
        checkMembers(app, currentInstance, next, userId);
      }

      // If an instance is updated, the instance from the DB is used to allow for permission checking when
      // a user is leaving a group
      else {
        Group.find({
          where: {id: contextGroup.id}
        }, function (err, groupDB) {

          if(err) {
            console.log(err);
          }
          else{
            checkMembers(app, groupDB[0], next, userId);
          }
        });
      }
    }
  });


  function checkMembers(app, group, next, userId) {

    // Get member IDs of current group
    var groupMemberIdsAsStings = [];
    for (var i = 0; i < group.groupMemberIds.length; i++) {
      groupMemberIdsAsStings.push(group.groupMemberIds[i].id);
    }

    // Get role ID of role 'admin'
    app.models.Role.find({where: {name: 'admin'}}, function (err, role) {

      if (err) throw err;

      var adminRoleId = role[0].id;

      // Get all role mappings from current user to role 'admin'
      app.models.RoleMapping.find({
          where: {
            principalId: userId,
            roleId: adminRoleId
          }
        },
        function (err, rolemappings) {

          if (err) throw err;

          // If user is neither a member of current group nor an admin,
          // reject the operation with an error
          if (groupMemberIdsAsStings.indexOf(userId.id) < 0
            && rolemappings.length === 0) {
            var err = new Error("Berechtigung erforderlich");
            err.statusCode = 403;
            next(err);
            return;
          }

          // Otherwise continue execution
          next();
        });
    });
  }

  /** This operation hook makes sure all references to a group in
   *  other model instances are removed before the group is deleted.
   */
  Group.observe('before delete', function(context, next){

    var models = Group.app.models;

    Group.find({where: context.where}, function(err, affectedGroups){

      if (err) throw err;

      // iterate over all affected Groups
      affectedGroups.forEach(function(group){

        // remove group reference in all members
        var membersQueryById = group.groupMemberIds.map(function(value){return {id: value};});
        models.PlatformUser.updateAll(
          {or: membersQueryById},
          {groupId: null},
          function(err, info){
            if (err) throw err;
          });

        // remove group reference in all labs
        if (group.labIds.length > 0) {
          var labQueryById = group.labIds.map(function(value){return {id: value};});
          models.Lab.updateAll(
            {or: labQueryById},
            {groupId: null},
            function(err, info) {
              if (err) throw err;
            });
        }

        // remove all priority mappings of deleted group
        models.Priority.destroyAll(
          {groupId: group._id},
          function(err, info){
            if (err) throw err;
          });

      });

      // actually remove the groups
      next();

    });
  });

  function generateDefaultName (listOfGroups) {

    var existingNames = listOfGroups.map(function(object){return object.name});
    var numGroups = listOfGroups.length;

    var defaultNamePattern = /^Gruppe \d+$/;

    var highestExistingNumber = 0;
    existingNames.forEach(function(name){
      if (defaultNamePattern.test(name)) {
        var numberStringInName = name.split(' ')[1];
        var numberInName = parseInt(numberStringInName);
        if (numberInName > highestExistingNumber) {
          highestExistingNumber = numberInName;
        }
      }
    });

    if (highestExistingNumber > numGroups) {
      return 'Gruppe ' + (highestExistingNumber + 1);
    } else {
      return 'Gruppe ' + (numGroups + 1);
    }
  }

  /* * * * * * * * * * * * * * * * * * * * * * * * * * */
  /*             R E M O T E   M E T H O D S           */
  /* * * * * * * * * * * * * * * * * * * * * * * * * * */

  Group.createByMail = function (emails, name, options, callback) {

    if (!emails) {
      callback(new Error('Missing email attribute'), null);
      return;
    }

    var app = Group.app;
    var userId = options.accessToken.userId;

    // Fetch active user
    app.models.PlatformUser.find({
      where: { id: userId }
    }, function(err, activeUserSearchResult){

      if (err) throw err;

      var activeUser = activeUserSearchResult[0];

      // Check if active user is already enrolled for a group
      if (activeUser.groupId) {
        Group.find({where: {id: activeUser.groupId}},
          function(err, groupSearchResult){

            if (err) throw err;
            callback(new Error('Active user is already enrolled for group '
                                + activeUser.groupId
                                + ' (' + groupSearchResult[0].name
                                + ')'), null);
            return;

          });
      }

      // Validate emails argument length
      app.models.Semester.find(
        {where: { id: activeUser.semesterId }},
        function(err, semesterSearchResult){

          if (err) throw err;

          var activeSemester = semesterSearchResult[0];
          if (emails.length !== activeSemester.group_size - 1) {
            callback(new Error('Invalid number of members. Group size for active semester is '
                               + activeSemester.group_size), null);
            return;
          }

          // Validate emails argument data type
          // and create db query array on the fly
          var i;
          var usersDBQuery = [];
          for (i in emails) {
            if (typeof(emails[i]) !== 'string') {
              callback(new Error('Value of emails argument must be an array of strings'), null);
              return;
            }
            usersDBQuery.push({email: emails[i]});
          }

          // Fetch user objects for specified email addresses
          app.models.PlatformUser.find(
            {where: { or: usersDBQuery}},
            function(err, usersSearchResult){

              if (err) throw err;

              if (usersSearchResult.length !== emails.length) {
                callback(new Error('Some of the specified email addresses do not match registered users'), null);
                return;
              }

              // Check specified users for:
              // - correct role
              // - correct semester
              // - active group membership
              // - not equal to active user
              var j;
              for (j=0; j<usersSearchResult.length; j++) {
                var examinedUser = usersSearchResult[j];
                var userString = examinedUser.id + ' (' + examinedUser.first_name
                  + ' ' + examinedUser.name + ')';
                if (examinedUser.isTutor) {
                  callback(new Error('User ' + userString
                    + ' has role tutor and cannot be assigned to a group'), null);
                  return;
                }
                if (examinedUser.semesterId.toString() != activeSemester.id.toString()) {
                  callback(new Error('User ' + userString
                    + ' is not enrolled for active user\'s semester'), null);
                  return;
                }
                if (examinedUser.groupId) {
                  callback(new Error('User ' + userString
                    + ' is already enrolled for group with id ' + examinedUser.groupId), null);
                  return;
                }
                if (examinedUser.id.id === activeUser.id.id) {
                  callback(new Error('emails array may not contain own email address'), null);
                  return;
                }
              }

              // Define new group object
              var groupMemberIds = usersSearchResult.map(function(user){return user.id});
              groupMemberIds.push(activeUser.id);
              var newGroup = {
                groupMemberIds: groupMemberIds,
                semesterId: activeSemester.id,
                labIds: [],
                priorityIds: []
              };

              // If name was specified, add it to the group object.
              // Otherwise generate a default name.
              app.models.Group.find(
                {where: {semesterId: activeSemester.id}},
                function(err, groupsOfActiveSemester){

                  if (err) throw err;

                  if (name) {
                    newGroup.name = name;
                  } else {
                    newGroup.name = generateDefaultName(groupsOfActiveSemester);
                  }

                  // Store the new group
                  Group.create(newGroup, function(err, createdGroup){

                    if (err) throw err;

                    console.log('User ' + activeUser.id + ' (' + activeUser.first_name
                      + ' ' + activeUser.name + ') created group ' + createdGroup.id
                      + ' (' + createdGroup.name + ')');

                    // Store the new groupId for in all group members
                    var userQueryById = groupMemberIds.map(function(id){return {id: id}});
                    app.models.PlatformUser.updateAll(
                      {or: userQueryById},
                      {groupId: createdGroup.id},
                      function (err, info) {

                        if (err) throw err;

                        callback(null, createdGroup);

                      }
                    );
                  });
                });
            });
        });
    });
  };

  Group.remoteMethod('createByMail', {
    accepts: [
      {arg: 'emails', type: 'array'},
      {arg: 'name', type: 'string'},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {arg: 'group', type: 'object'}
  });

  /** Automatically assigns current user to a free group. If
   * there are no free places, assigns user to a new group.
   * @param callback
   */
  Group.randomJoin = function (options,callback) {

    var app = Group.app;
    var userId = options.accessToken.userId;

    // Fetch active user
    app.models.PlatformUser.find({
      where: { id: userId }
    }, function(err, activeUserSearchResult) {

      if (err) throw err;

      var activeUser = activeUserSearchResult[0];

      // Check for correct user role
      if (activeUser.isTutor || activeUser.isAdmin) {
        callback(new Error('Active user has invalid role. Only students are allowed to enroll for groups.'), null);
        return;
      }

      // Check if active user is already enrolled for a group
      if (activeUser.groupId) {
        Group.find({where: {id: activeUser.groupId}},
          function (err, groupSearchResult) {

            if (err) throw err;
            callback(new Error('Active user is already enrolled for group '
              + activeUser.groupId
              + ' (' + groupSearchResult[0].name
              + ')'), null);
          });
        return;
      }

      // Get group_size of active semester
      app.models.Semester.find(
        {where: { id: activeUser.semesterId }},
        function(err, semesterSearchResult) {

          if (err) throw err;

          var groupSize = semesterSearchResult[0].group_size;

          // Fetch all groups of active semester
          Group.find(
            {where: { semesterId: activeUser.semesterId }},
            function (err, groupsOfActiveSemester) {

              if (err) throw err;

              // Check if there is a free group
              var freeGroupIndex = -1;
              groupsOfActiveSemester.some(function(current, index){
                if (current.groupMemberIds.length < groupSize) {
                  freeGroupIndex = index;
                  return true;
                }
                return false;
              });

              // If no free group, create a new group
              if (freeGroupIndex < 0) {
                Group.create(
                  {
                    name: generateDefaultName(groupsOfActiveSemester),
                    groupMemberIds: [activeUser.id],
                    semesterId: activeUser.semesterId,
                    labIds: [],
                    priorityIds: []
                  },
                  function(err, createdGroup){

                    if (err) throw err;

                    // Store created group in user instance
                    app.models.PlatformUser.updateAll(
                      {id: activeUser.id},
                      {groupId: createdGroup.id},
                      function (err) {

                        if (err) throw err;

                        // Return group
                        callback(null, createdGroup);
                        return;

                      });
                  });

              // If free group exists, join it
              } else {
                var joinedGroup = groupsOfActiveSemester[freeGroupIndex];
                var members = joinedGroup.groupMemberIds;
                members.push(activeUser.id);

                joinedGroup.updateAttribute(
                  'groupMemberIds',
                  members,
                  function(err, instance){

                    if (err) throw err;

                    // store joined group in user instance
                    app.models.PlatformUser.updateAll(
                      {id: activeUser.id},
                      {groupId: joinedGroup.id},
                      function (err) {

                        if (err) throw err;

                        // Return group
                        callback (null, instance);

                      });

                  });
              }
            });
        });
    });
  };

  Group.remoteMethod('randomJoin', {
    accepts: [ {arg: "options", type: "object", http: "optionsFromRequest"}],
    returns: {arg: 'group', type: 'object'}
  });
};
