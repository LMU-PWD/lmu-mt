'use strict';

module.exports = function (Exercise) {



  /* * * * * * * * * * * * * * * * * * * * * * * * * * */
  /*             R E M O T E   M E T H O D S           */
  /* * * * * * * * * * * * * * * * * * * * * * * * * * */


  /**
   * This Method adds the user as a participant to an exercise and
   * Updates the exercise array in the user.
   * @param exerciseId The Exercise a user is enrolled in
   * @param cb Callback function
   */

  Exercise.enroll = function (exerciseId, options, cb) {

    var app = Exercise.app;
    var userId = options.accessToken.userId;
    Exercise.find({where: {id: exerciseId}}, function (err, ex) {

      if (err) {
        console.log(err);
        cb(new Error("Could not query Exercise Model", null));
        return;
      }

      if (ex.length < 1) {
        cb(new Error("No Exercise with this ID found", null));
        return;
      }
      var newParticipants = ex[0].participantsUserIds;
      // Casting IDs to Strings so they are searchable
      var participantsStrings = [];
      for (var i = 0; i < newParticipants.length; i++) {
        participantsStrings.push(newParticipants[i] + "");
      }

      if (participantsStrings.indexOf(userId + "") > -1) { // Safe Cast to String
        cb(new Error("User is already part of this Exercise", null));
        return;
      }
      else {
        newParticipants.push(userId);
        Exercise.updateAll({id: exerciseId}, {
            participantsUserIds: newParticipants
          }, function (err, newEx) {
            if (err) {
              console.log(err);
              cb(new Error("Could not update Exercise Model", null));
              return;
            }

            // Update the User:

            app.models.PlatformUser.find({where: {id: userId}}, function(err, usersSearchResult) {

              if (err) throw err;

              if (usersSearchResult.length > 0) {

                var currentUser = usersSearchResult[0];
                var exerciseIds = currentUser.exerciseIds;
                exerciseIds.push(exerciseId);
                app.models.PlatformUser.updateAll({id: userId}, {exerciseIds: exerciseIds}, function (err, activeUserSearchResult) {
                  if (err) {
                    console.log(err);
                    cb(new Error("Could not update User Model", null));
                    return;
                  }
                });

              } else {

                cb(new Error("No user was found when querying for current user id"), null);

              }
            });

            // SUCCESS CALLBACK
            cb(null, newEx);
            return;
          }
        )
      }
    });
  };

  Exercise.remoteMethod('enroll', {
    accepts: [
      {arg: 'exerciseId', type: 'string'},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {arg: 'exercise', type: 'object'}
  });


  /**
   * This Method deletes the user as a participant from an exercise and
   * Updates the exercise array in the user.
   * @param exerciseId The Exercise a user is deleted from
   * @param cb Callback function
   */

  Exercise.disenroll = function (exerciseId, options, cb) {

    var app = Exercise.app;
    var userId = options.accessToken.userId;
    Exercise.find({where: {id: exerciseId}}, function (err, ex) {

      if (ex.length < 1) {
        cb(new Error("No Exercise with this ID found", null));
        return;
      }

      if (err) {
        console.log(err);
        cb(new Error("Could not query Exercise Model", null));
        return;
      }

      if (ex.length < 0) {
        cb(new Error("Invalid Exercise ID", null));
        return;
      }

      var participants = ex[0].participantsUserIds;
      var userIDString = userId + "";
      for (var i = 0; i < participants.length; i++) {
        var partString = participants[i] + "";
        if (partString == userIDString) {
          participants.splice(i, 1);
          break;
        }
      }

      // Update Exercise Model
      Exercise.updateAll({id: exerciseId}, {
        participantsUserIds: participants
      }, function (err, success) {
        if (err) console.log(err);

        // Update PlaformUser Model:
        app.models.PlatformUser.find({where: {id: userId}}, function (err, user) {
          if (err) {
            console.log(err);
            cb(new Error("Could not update User Model", null));
            return;
          }
          var exercises = user[0].exerciseIds;
          var exercisesStrings = [];
          for (var i = 0; i < exercises.length; i++) {
            exercisesStrings = exercises[i] + "";
          }
          var deleteIndex = exercisesStrings.indexOf(exerciseId + "");
          exercises.splice(deleteIndex, 1);
          app.models.PlatformUser.updateAll({id: userId}, {exerciseIds: exercises}, function (err, success) {
            if (err) {
              console.log(err);
              cb(new Error(err, null));
              return;
            }

            cb(null, ex);

          })
        })
      });
    });
  };


  Exercise.remoteMethod('disenroll', {
    accepts: [
      {arg: 'exerciseId', type: 'string'},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {arg: 'exercise', type: 'object'}
  });

};
