'use strict';
var app = require('../../server/server');

module.exports = function (Platformuser) {

  /** Define an observer that fires before every save operation on the
   *  PlatformUsers (User Registration) table. If the E-Mail adress was not
   *  added to the PendingPlatform table by an admin or tutor ("whitelisted"),
   *  the registration will fail by throwing an 403 error.
   *
   *  After that, it is checked if the user is whitelisted as a tutor
   *  (isTutor = true) and the field is set accordingly.
   */
  Platformuser.observe('before save', function (context, next) {

    if (context.instance && context.isNewInstance) {

      var user = context.instance;
      var PendingPlatformUser = app.models.PendingPlatformUser;

      PendingPlatformUser.find({where: {email: user.email}}, function (err, res) {

        if (res.length < 1) {

          var err = new Error("User can not be registered. Email has to be whitelisted by administrator");
          err.statusCode = 403;
          next(err);
          return;

        } else {

          // Check if the new user is whitelisted with a special role.
          //
          // The following rules apply:
          // - isAdmin overrules isTutor
          // - isAdmin == false && isTutor == false implies isStudent == true
          //
          // Attributes isTutor and isAdmin in the request object are ignored.
          if (res[0].isAdmin) {
            context.instance.isAdmin = true;
            context.instance.isTutor = false;
            context.instance.isStudent = false;
          } else if (res[0].isTutor) {
            context.instance.isAdmin = false;
            context.instance.isTutor = true;
            context.instance.isStudent = false;
          } else {
            context.instance.isAdmin = false;
            context.instance.isTutor = false;
            context.instance.isStudent = true;
          }

          /* Take first and last name from PendingPlatformUser */
          if (res[0].first_name && res[0].name && res[0].semesterId) {
            context.instance.first_name = res[0]['first_name'];
            context.instance.name = res[0].name;
            context.instance.semesterId = res[0].semesterId;
            next();
          } else {
            var err = new Error("Invalid Data in Whitelist.");
            err.statusCode = 500;
            next(err);
            return;
          }
        }
      });

    } else {
      next();
    }

  });


  /** Define an observer that fires after every save operation on the PlatformUsers table.
   *  If the isTutor flag of an instance has changed, this method reflects the change
   *  in the RoleMappings table
   */
  Platformuser.observe('after save', function (context, next) {

    var app = Platformuser.app;

    if (context.instance) {

      // Search for role object of role 'tutor'
      app.models.Role.find(
        {where: {or: [{name: 'tutor'}, {name: 'admin'}]}},
        function (err, roles) {

          if (err) throw err;

          var adminRole, tutorRole;
          roles.forEach(function (role) {
            switch (role.name) {
              case 'admin':
                adminRole = role;
                break;
              case 'tutor':
                tutorRole = role;
                break;
            }
          });

          // Search for all role mappings of the saved user to the tutor role
          app.models.RoleMapping.find({
              where: {
                principalId: context.instance.id,
                roleId: tutorRole.id
              }
            },
            function (err, rolemappings) {

              if (err) throw err;

              // saved user is tutor and role mapping does not exist yet
              if (context.instance.isTutor && rolemappings.length === 0) {

                // create new role mapping for user
                app.models.RoleMapping.create({
                  principalType: 'USER',
                  principalId: context.instance.id,
                  roleId: tutorRole.id
                }, function (err, newRoleMapping) {

                  if (err) throw err;

                });

              }

              // saved user is not tutor but role mapping still exists
              else if (!context.instance.isTutor && rolemappings.length > 0) {

                // delete role mapping for user
                var i;
                for (i in rolemappings) {
                  app.models.RoleMapping.destroyById(rolemappings[i].id, function (err) {

                    if (err) throw err;
                    console.log('Deleted RoleMapping');

                  });
                }
              }

              // in all other cases we're fine

            });

          // Search for all role mappings of the saved user to the admin role
          app.models.RoleMapping.find({
              where: {
                principalId: context.instance.id,
                roleId: adminRole.id
              }
            },
            function (err, rolemappings) {

              if (err) throw err;

              // saved user is admin and role mapping does not exist yet
              if (context.instance.isAdmin && rolemappings.length === 0) {

                // create new role mapping for user
                app.models.RoleMapping.create({
                  principalType: 'USER',
                  principalId: context.instance.id,
                  roleId: adminRole.id
                }, function (err, newRoleMapping) {

                  if (err) throw err;

                });

              }

              // saved user is not admin but role mapping still exists
              else if (!context.instance.isAdmin && rolemappings.length > 0) {

                // delete role mapping for user
                var i;
                for (i in rolemappings) {
                  app.models.RoleMapping.destroyById(rolemappings[i].id, function (err) {

                    if (err) throw err;
                    console.log('Deleted RoleMapping');

                  });
                }
              }

              // in all other cases we're fine

            });
        });

      if (context.isNewInstance) {

        // User is registered => Delete from Whitelist

        var PendingPlatformUser = app.models.PendingPlatformUser;
        var userMail = context.instance.email;
        PendingPlatformUser.destroyAll({email: userMail}, function (err, res) {
          if (err) throw err;
        });
      }

    }

    next();

  });


  /**
   *  Defines an observer after a create call.
   *  Sends a short E-Mail to the user in order to verify the address.
   *  After the User has clicked the link in the mail, he can is redirected to the 'redirectSwitch' URL.
   *  The 'redirectSwitch' URL can be set using a Node Variable:
   *  Windows: set MT_VERIFICATION_REDIRECT=http://www.somedomain.com/login
   *  Unix: export MT_VERIFICATION_REDIRECT=http://www.somedomain.com/login
   *
   *  If no Node Variable is set "http://localhost:8080/login" is used.
   *
   *  A User can not log in without verifying his address.
   *
   *  The E-Mail server is configured in datasources.json
   */
  Platformuser.afterRemote('create', function (context, userInstance, next) {

    var redirectSwitch;
    if(process.env.MT_VERIFICATION_REDIRECT!=undefined){
      redirectSwitch=process.env.MT_VERIFICATION_REDIRECT;
    }
    else {
      redirectSwitch="http://localhost:8080/login"
    }

    var options = {
      type: 'email',
      to: userInstance.email,
      from: 'noreply@mt.medien.ifi.lmu.de',
      subject: 'Medientechnik Registrierung',
      redirect: redirectSwitch,
      user: userInstance,
      templateFn: generateEmail
    };

    userInstance.verify(options, function (err, response, next) {
      if (err) return next(err);

      context.res.json({
        title: 'Signed up successfully',
        content: 'Please check your email and click on the verification link ' +
        'before logging in.'
      });
    });

  });


  /**
   * Helper Method for the E-Mail verify routine. Generates an E-Mail with a user-specific verification link
   * @param options Options Object provided by PlatformUser.verify
   * @param cb Callback
   */
  function generateEmail(options, cb) {

    // URL of this app => Works in development and in production
    var baseUrl = app.get('url');
    if (process.env.MT_VERIFICATION_BASEURL) {
      baseUrl = process.env.MT_VERIFICATION_BASEURL;
    }

    Platformuser.findOne({where: {email: options.user.email}}, function (err, res) {
      if (err)
        cb(err);
      var id = res.id + ""; // Stringify the ID
      var email = "<div>Herzlich willkommen zur Plattform des Kurses Medientechnik. <br/> Bevor du dich einloggen kannst, " +
        "musst du deine E-Mail-Adresse bestätigen. Klicke dafür unten auf den Link. <br/> Solltest du dich nicht angemeldet " +
        "haben, kannst du diese E-Mail ignorieren.<br/><br/>" +
        "<a href='"+baseUrl+"api/PlatformUsers/confirm?uid=" + id + "&redirect="+options.redirect+"&token="
        + options.user.verificationToken + "'> Bestätige deine E-Mail-Adresse</a></div>";
      cb(undefined, email);

    });
  }

  Platformuser.changePassword = function (oldPassword, newPassword, options, cb) {

    var app = Platformuser.app;
    var userId = options.accessToken.userId;

    Platformuser.findById(userId, function(err, user){
      if (err) {
        cb(err, undefined);
        throw err;
      }

      user.hasPassword(oldPassword, function(err, isMatch) {

        if (err) throw err;
        if (isMatch) {
          // PW is hashed automatically by Loopback
          user.password = newPassword;
          user.save();
          cb(undefined, user);
        } else {
          cb(new Error('Wrong password provided'), undefined);
        }

      });
    })

  };

  Platformuser.remoteMethod('changePassword', {
    accepts: [
      {arg: 'oldPassword', type: 'string'},
      {arg: 'newPassword', type: 'string'},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {arg: 'platformUser', type: 'object'}
  });

  /**
   * Adds elements to tutorPossibleLabs relation of a given PlatformUser instance
   *
   * @param tutorId - ID of a PlatformUser (only isTutor === true allowed). If not specified,
   *                  the ID of the requesting PlatformUser is used
   * @param labIds - array of IDs of Lab instances
   * @param options - http context
   * @param next - callback
   * @returns updated list of tutorPossibleLabs
   */
  Platformuser.addTutorPossibleLabs = function (tutorId, labIds, options, next) {

    var Lab = Platformuser.app.models.Lab,
      userId = tutorId,
      affectedUser,
      affectedUserPossibleLabs,
      affectedLabs;

    if (!userId) {
      userId = options.accessToken.userId;
    }

    Platformuser.find({where: {id: userId}}, function (err, userSearchResult) {

      if (err) throw err;
      if (userSearchResult.length === 0) {
        next(new Error('No PlatformUser instance with id '+userId+' found'), null);
        return;
      }

      affectedUser = userSearchResult[0];

      if (!affectedUser.isTutor) {
        next(new Error('PlatformUser with id '+userId+' is not a tutor'), null);
        return;
      }

      Lab.find({where: {id: {inq: labIds}}}, function (err, labSearchResult) {

        if (err) throw err;
        if (labSearchResult.length === 0) {
          next(new Error('No Lab instances with specified ids found'), null);
          return;
        }

        affectedLabs = labSearchResult.slice();

        affectedUser.__get__tutorPossibleLabs(function(err, possibleLabs){

          if (err) throw err;
          affectedUserPossibleLabs = possibleLabs.slice();
          var affectedUserPossibleLabsAsStrings = affectedUserPossibleLabs.map(function(idObject){
            return idObject.toString();
          });
          affectedLabs.forEach(function(affectedLab){
            if (affectedUserPossibleLabsAsStrings.indexOf(affectedLab.id.toString()) < 0) {
              affectedUserPossibleLabs.push(affectedLab.id);
            }
          });

          Platformuser.updateAll({id: userId}, {tutorPossibleLabs: affectedUserPossibleLabs}, function(err, info){

            if (err) throw err;
            if (info.count > 1) {
              next(new Error('Warning: Update affected more than one PlatformUser instance ('
                +info.count+' total)'), null);
              return;
            }
            if (info.count < 1) {
              next(new Error('No update performed'), null);
              return;
            }

            next(null, affectedUserPossibleLabs);

          });
        });
      });
    });
  };

  Platformuser.remoteMethod('addTutorPossibleLabs', {
    accepts: [
      {arg: 'tutorId', type: 'string'},
      {arg: 'labIds', type: 'array'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest'}
    ],
    returns: [
      {type: 'object', root: true}
    ]
  });

  /**
   * Deletes tutorPossibleLab references for a given PlatformUser. If a labTypeId is specified,
   * deletes all references to Labs that belong to this LabType. Otherwise removes all
   * references to Labs specified in the labIds array.
   *
   * @param tutorId - ID of a PlatformUser (only isTutor === true allowed). If not specified,
   *                  the ID of the requesting PlatformUser is used
   * @param labTypeId - ID of a LabType instance
   * @param labIds - array of IDs of Lab instances
   * @param options - http context
   * @param next - callback
   * @returns updated list of tutorPossibleLabs
   */
  Platformuser.removeTutorPossibleLabs = function (tutorId, labTypeId, labIds, options, next) {

    var Lab = Platformuser.app.models.Lab,
      userId = tutorId,
      affectedUser,
      affectedLabs,
      tutorPossibleLabs;

    if (!userId) {
      userId = options.accessToken.userId;
    }

    Platformuser.find({where: {id: userId}}, function (err, userSearchResult) {

      if (err) throw err;
      if (userSearchResult.length === 0) {
        next(new Error('No PlatformUser instance with id ' + userId + ' found'), null);
        return;
      }

      affectedUser = userSearchResult[0];

      if (!affectedUser.isTutor) {
        next(new Error('PlatformUser with id ' + userId + ' is not a tutor'), null);
        return;
      }

      var query = (labTypeId) ? {labTypeId: labTypeId} : {id: {inq: labIds}};

      Lab.find({where: query}, function(err, labSearchResult) {

        if (err) throw err;
        if (labSearchResult.length === 0) {
          next(new Error('No Labs found with given criteria. Nothing to delete.'), null);
          return;
        }

        affectedLabs = labSearchResult.slice();

        affectedUser.__get__tutorPossibleLabs(function(err, possibleLabs){

          if (err) throw err;
          tutorPossibleLabs = possibleLabs;
          var labIdsForLabType = affectedLabs.map(function(lab){
            return lab.id.toString();
          });
          var reducedTutorPossibleLabs = tutorPossibleLabs.filter(function(idObject){
            return (labIdsForLabType.indexOf(idObject.toString()) < 0);
          });

          Platformuser.updateAll({id: userId}, {tutorPossibleLabs: reducedTutorPossibleLabs}, function(err, info){

            if (err) throw err;
            if (info.count > 1) {
              next(new Error('Warning: Update affected more than one PlatformUser instance ('
                +info.count+' total)'), null);
              return;
            }
            if (info.count < 1) {
              next(new Error('No update performed'), null);
              return;
            }

            next(null, reducedTutorPossibleLabs);
          });
        });
      });
    });
  };

  Platformuser.remoteMethod('removeTutorPossibleLabs', {
    accepts: [
      {arg: 'tutorId', type: 'string'},
      {arg: 'labTypeId', type: 'string'},
      {arg: 'labIds', type: 'array'},
      {arg: 'options', type: 'object', http: 'optionsFromRequest' }
    ],
    returns: [
      {type: 'object', root: true}
    ]
  });

  Platformuser.setPassedLabType = function (userId, labTypeId, passed, next) {

    var affectedUser, affectedLabType,
        LabType = Platformuser.app.models.LabType;

    // get user
    Platformuser.find({where: {id: userId}}, function (err, userSearchResult) {

      if (err) throw err;
      if (userSearchResult.length === 0) {
        next(new Error('No PlatformUser instance with id '+userId+' found'), null);
        return;
      }

      affectedUser = userSearchResult[0];

      // get labType
      LabType.find({where: {id: labTypeId}}, function(err, labTypeSearchResult){

        if (err) throw err;
        if (labTypeSearchResult.length === 0) {
          next(new Error('No LabType instance with id '+labTypeId+' found'), null);
          return;
        }

        affectedLabType = labTypeSearchResult[0];

        // check if user has passed this LabType already
        var passedLabTypes = affectedUser.passedLabTypesIds;
        var passedLabTypesAsStrings = passedLabTypes.map(function(id){
          return id.toString();
        });
        var searchIndex = passedLabTypesAsStrings.indexOf(labTypeId);
        // adjust relation accordingly
        if (passed && searchIndex < 0) {
          // User has passed the lab but is not yet stored in his passedLabs
          passedLabTypes.push(affectedLabType.id);
        } else if (!passed && searchIndex >= 0) {
          // User has not passed the lab but it is still stored in his passedLabs
          passedLabTypes.splice(searchIndex, 1);
        }

        // store user
        affectedUser.updateAttribute('passedLabTypesIds', passedLabTypes, function(err, instance) {

          if (err) throw err;
          next(null, instance);

        });
      });
    });
  };

  Platformuser.remoteMethod('setPassedLabType', {
    accepts: [
      {arg: 'userId', type: 'string'},
      {arg: 'labTypeId', type: 'string'},
      {arg: 'passed', type: 'boolean'}
    ],
    returns: [
      {type: 'object', root: true}
    ]
  });

};


