'use strict';

module.exports = function(Lab) {

  /**
   * Sets the `passed` flag of a given lab instance and updates all
   * members of the assigned group accordingly.
   *
   * @param labId - ID of the lab to change
   * @param passed - new value of the `passed` flag
   * @param next - callback
   * @returns the updated lab instance
   */
  Lab.setPassed = function (labId, passed, next) {

    var Group = Lab.app.models.Group,
        PlatformUser = Lab.app.models.PlatformUser,
        affectedLab, affectedGroup, affectedUsers,
        passedLabsPerUser = new Map();

    // Get lab
    Lab.find({ where: {id: labId} }, function(err, labSearchResult){

      if (err) throw err;
      if (labSearchResult.length === 0) {
        next(new Error('No lab with id '+labId+' found'), null);
        return;
      }

      affectedLab = labSearchResult[0];

      // Has group?
      if (!affectedLab.groupId) {
        next(new Error('Lab with id '+labId+' has no group assigned'), null);
        return;
      }

      // Get group
      Group.find({ where: {id: affectedLab.groupId} }, function(err, groupSearchResult) {

        if (err) throw err;
        if (groupSearchResult.length === 0) {
          next(new Error('No group with id '+affectedLab.groupId+' found'), null);
          return;
        }

        affectedGroup = groupSearchResult[0];

        // Get group members
        PlatformUser.find({where: {id: {inq: affectedGroup.groupMemberIds}}}, function(err, userSearchResult){

          if (err) throw err;
          if (userSearchResult.length === 0) {
            next(new Error('No users with specified IDs found'), null);
            return;
          }

          // Create a map of passedLabTypes per memberId
          affectedUsers = userSearchResult;
          var userSaveOperations = [];
          affectedUsers.forEach(function(user) {
            var passedLabTypes = user.passedLabTypesIds;
            var passedLabTypesAsStrings = passedLabTypes.map(function(id){
              return id.toString();
            });
            var searchIndex = passedLabTypesAsStrings.indexOf(affectedLab.labTypeId.toString());
            if (passed && searchIndex < 0) {
              // User has passed the lab but is not yet stored in his passedLabs
              passedLabTypes.push(affectedLab.labTypeId);
            } else if (!passed && searchIndex >= 0) {
              // User has not passed the lab but it is still stored in his passedLabs
              passedLabTypes.splice(searchIndex, 1);
            }
            // Update user asynchronously
            userSaveOperations.push(
              new Promise(function(resolve, reject){
                user.updateAttribute('passedLabTypesIds', passedLabTypes, function(err){
                  if (err) {
                    throw err;
                    return reject(err);
                  }
                  resolve();
                });
              }));
          });

          var userWrapperPromise = Promise.all(userSaveOperations);
          userWrapperPromise.then(function(){

            // Update Lab
            affectedLab.updateAttribute('passed', passed, function(err, updatedLabInstance){

              if (err) throw err;
              next(null, updatedLabInstance);

            });
          });
        });
      });
    });
  };

  Lab.remoteMethod('setPassed', {
    accepts: [
      {arg: 'labId', type: 'string'},
      {arg: 'passed', type: 'boolean'}
    ],
    returns: [
      {type: 'object', root: true}
    ]
  });

};
