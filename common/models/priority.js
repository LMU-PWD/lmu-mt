'use strict';
var app = require('../../server/server');
module.exports = function (Priority) {

  Priority.observe('before save', function (context, next) {

    if (context.instance && context.instance.labId) {

      Priority.app.models.Lab.find(
        {where: {id: context.instance.labId}},
        function (err, labSearchResult) {

          if (err) throw err;

          if (labSearchResult.length > 0) {

            context.instance.labTypeId = labSearchResult[0].labTypeId;

            next();

          } else {

            next(new Error("Lab with id " + context.instance.labId + " not found"));

          }

        });

    } else {

      next(new Error("Instances of Priority model must have a member labId"));

    }

  });

  /**
   * This observer adds the Priority ID to the priorityIds field in the Group provided in the groupId field of
   * the Priority
   */
  Priority.observe('after save', function (context, next) {

    var currentInstance = null;
    if (context.currentInstance) {
      currentInstance = context.currentInstance;
    }
    else if (context.instance) {
      currentInstance = context.instance;
    }

    if (currentInstance != undefined && currentInstance != null) {
      currentInstance.__get__group(function (err, group) {

        if (err) throw err;

        // Linking Prio to Group:
        group.priorities.add(currentInstance.id, function (err, res) {
          if (err) throw err;
          next();

        })

      })
    }

    else {
      next();
    }
  });

  /**
   * This observer removes the Priority ID from the priorityIds field in the Group provided in the groupId field of
   * the Priority
   */
  Priority.observe('before delete', function (context, next) {

    Priority.findById(context.where.id, function (err, currentInstance) {

      if (currentInstance != undefined && currentInstance != null) {
        currentInstance.__get__group(function (err, group) {
          if (err) throw err;
          // Unlinking Prio from Group
          group.priorities.remove(context.where.id, function (err, res) {
            if (err) throw err;
            next();
          });
        })
      }

      else {
        next();
      }

    });

  });

  Priority.deleteByGroupAndLabType = function (groupId, labTypeId, next) {

    if (!groupId || !labTypeId) {
      next(new Error('groupId and labTypeId must be specified'), null);
      return;
    }

    Priority.destroyAll(
      {and: [
        {groupId: groupId},
        {labTypeId: labTypeId}
      ]},
      function(err, info){
        if (err) {
          next(err, null);
          return;
        }
        next(null, info);
      });
  };

  Priority.remoteMethod('deleteByGroupAndLabType', {
    http: {
      verb: 'del'
    },
    accepts: [
      {arg: 'groupId', type: 'string'},
      {arg: 'labTypeId', type: 'string'}
    ],
    returns: [
      {arg: 'count', type: 'number'}
    ]
  });

};
