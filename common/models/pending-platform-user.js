'use strict';

module.exports = function(Pendingplatformuser) {

  /** Operation hook for validation of new PendingPlatformUsers.
   */
  Pendingplatformuser.observe('before save', function (context, next) {

    var PlatformUser = Pendingplatformuser.app.models.PlatformUser;

    function resumeCreation () {

      // Make sure whitelist entry has not more than one special role
      // - isAdmin overrules isTutor
      // - isAdmin == false && isTutor == false implies that the user is a student
      if (context.instance.isAdmin) {
        context.instance.isTutor = false;
      }

      next();
    }

    if (context.isNewInstance) {

      // Make sure email address is not already listed on whitelist
      Pendingplatformuser.find({}, function(err, whitelistSearchResult) {

        if (err) throw err;

        var pendingMails = whitelistSearchResult.map(function(obj){return obj.email});
        var pendingSearchIndex = pendingMails.indexOf(context.instance.email);
        if (pendingSearchIndex >= 0) {
          Pendingplatformuser.destroyById(whitelistSearchResult[pendingSearchIndex].id, function(err){
            if (err) throw err;
            resumeCreation();
          });
          return;
        }

        // Make sure email address is not already registered
        PlatformUser.find({}, function(err, userSearchResult) {

          if (err) throw err;

          var registeredMails = userSearchResult.map(function(obj){return obj.email});
          var registeredSearchIndex = registeredMails.indexOf(context.instance.email);
          if (registeredSearchIndex >= 0) {
            PlatformUser.destroyById(userSearchResult[registeredSearchIndex].id, function(err){
              if (err) throw err;
              resumeCreation();
            });
          } else {
            resumeCreation();
          }
        });
      });

    } else {
      next();
    }

  });

};
