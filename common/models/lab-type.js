'use strict';

/**
 * Shuffles the elements of an array randomly.
 *
 * Taken from http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 *
 * @param a - an array
 */
function shuffle(a) {
  var j, x, i;
  for (i = a.length; i; i--) {
    j = Math.floor(Math.random() * i);
    x = a[i - 1];
    a[i - 1] = a[j];
    a[j] = x;
  }
}

/**
 * Returns the intersection between two arrays
 *
 * @param a - an Array
 * @param b - an Array
 * @returns {Array.<T>|*|{x}|{}}
 */
function intersection (a, b) {
  var temp = [];
  return a.filter(function(val) {
    if (b.indexOf(val) >= 0 && temp.indexOf(val) < 0) {
      temp.push(val);
      return true;
    } else {
      return false;
    }
  });
}

/**
 * Returns the difference a \ b of two arrays
 *
 * @param a - an Array
 * @param b - an Array
 * @returns {Array}
 */
function difference (a, b) {
  return a.filter(function(val){
    return b.indexOf(val) < 0;
  });
}

module.exports = function(Labtype) {

  /**
   * For a set of Lab instances with a given labTypeId, assign one tutor to each
   * Lab - if possible - according to the preferences stored in the tutor's
   * tutorPossibleLabs relation. Labs with no tutor candidate will have a
   * tutorId of null.
   *
   * @param labTypeId
   * @param next - middleware function
   * @returns all affected Lab instances with changes made
     */
  Labtype.autoDistributeTutors = function (labTypeId, next) {

    var Lab = Labtype.app.models.Lab,
        PlatformUser = Labtype.app.models.PlatformUser,

        labTypeInstance,            // labType for distribution
        labsForDistribution,        // all labs with this labType
        labIds,                     // array of labsForDistribution.id values
        tutorsForDistribution,      // all tutors affected by this distribution
        labMeta,                    // map with temporary information about affected labs (see below)
        tutorMeta,                  // map with some statistical info about affected tutors (see below)
        idealNumberOfLabs;          // number of labs per tutor so that all tutors work approximately the same

    if (!labTypeId) {
      next(new Error('No labTypeId specified'), null);
      return;
    }

    // Get specified labType instance
    Labtype.find({where: {id: labTypeId}}, function (err, labTypeSearchResult) {

      if (err) throw err;
      if (labTypeSearchResult.length == 0) {
        next(new Error('LabType with id '+labTypeId+' not found'), null);
        return;
      }

      labTypeInstance = labTypeSearchResult[0];
      if (labTypeInstance.groupsDistributed) {
        next(new Error('Tutor distribution denied. Groups have already been distributed on this LabType.'), null);
        return;
      }

      // Get all Labs for this LabType
      Lab.find({where: {labTypeId: labTypeId}}, function (err, labSearchResult) {

        if (err) throw err;
        if (labSearchResult.length == 0) {
          next(new Error('LabType with id '+labTypeId+' has no associated Labs'), null);
          return;
        }

        labsForDistribution = labSearchResult;
        labIds = labsForDistribution.map(function(lab){
          return lab.id.toString();
        });

        // Get all tutors that have marked at least one of labsForDistribution as possibleLab
        PlatformUser.find(
          { where: { tutorPossibleLabs: { inq: labIds } } },
          function (err, tutorSearchResult) {

            if (err) throw err;
            if (tutorSearchResult.length == 0) {
              next(new Error('No tutors have marked labs from this labType as possible'), null);
              return;
            }

            tutorsForDistribution = tutorSearchResult;

            console.log('\nStarting auto distribution of tutors for labTypeId '+labTypeId+'...');

            idealNumberOfLabs = Math.floor(labsForDistribution.length / tutorsForDistribution.length);

            // Assemble labMeta map like this
            // {
            //    <<labId>> => {
            //      assigned: false,
            //      candidates: [ <<tutorId>>, <<tutorId>>, ... ]
            //    },
            //    ...
            // }
            labMeta = new Map();
            tutorsForDistribution.forEach(function(tutor){
              var possibleLabIds = tutor.tutorPossibleLabs();
              possibleLabIds.forEach(function(value){
                var possibleLabId = value.toString();
                if (labIds.indexOf(possibleLabId) >= 0) {
                  var existingVal = labMeta.get(possibleLabId);
                  if (existingVal) {
                    existingVal.candidates.push(tutor.id.toString());
                    labMeta.set(possibleLabId, existingVal);
                  } else {
                    labMeta.set(possibleLabId, {
                      assigned: false,
                      candidates: [tutor.id.toString()]
                    });
                  }
                }
              });
            });

            // Assemble tutorMeta map like this
            // {
            //    <<tutorId>> => {
            //      probabilities: [ 0.5, 0.66, 0.33, ... ],
            //      averageProbability: 0.5,
            //      invertedAverage: 0.3437,
            //      compensationFactor: 6,
            //      labsAssigned: 0
            //    },
            //    ...
            // }

            // Store a probability value for each lab the tutor marked as possible
            tutorMeta = new Map();
            labMeta.forEach(function(value){
              var probability = 1 / value.candidates.length;
              value.candidates.forEach(function(tutorId){
                var existingValue = tutorMeta.get(tutorId);
                if (existingValue && existingValue.probabilities) {
                  existingValue.probabilities.push(probability);
                  tutorMeta.set(tutorId, existingValue);
                } else if (existingValue) {
                  existingValue.probabilities = [probability];
                  tutorMeta.set(tutorId, existingValue);
                } else {
                  tutorMeta.set(tutorId, {
                    probabilities: [probability],
                    labsAssigned: 0
                  });
                }
              });
            });

            // Calculate the average probability of getting chosen for each tutor
            tutorMeta.forEach(function(value, key){
              var probabilitiesSum = 0;
              value.probabilities.forEach(function(probability){
                probabilitiesSum += probability;
              });
              value.averageProbability = probabilitiesSum / value.probabilities.length;
              tutorMeta.set(key, value);
            });

            // Calculate the invertedAverage for each tutor by mirroring its
            // averageProbability along the average of all tutor's averageProbabilities.
            //
            // Then calculate the factor that will raise (or lower) its probability of being
            // chosen to match this invertedAverage
            var tutorMetaValues = Array.from(tutorMeta.values());
            var averages = tutorMetaValues.map(function(val){
              return val.averageProbability;
            });
            var averageSum = averages.reduce(function(acc, val){ return acc + val; }, 0);
            var averageOfAverages = averageSum / averages.length;
            tutorMeta.forEach(function(value, key){
              var diff = averageOfAverages - value.averageProbability;
              value.invertedAverage = averageOfAverages + diff;
              value.compensationFactor =
                Math.round((value.invertedAverage / value.averageProbability) * 10);
              tutorMeta.set(key, value);
            });

            // Before making any changes to the model, reset all relations between
            // affected Lab and PlatformUser instances
            Lab.updateAll(
              { labTypeId: labTypeId },
              { tutorId: null },
              function(err){

                if (err) {
                  next(err, null); return;
                }

                console.log('All affected models have been reset');

                /**
                 * Private helper for assigning tutors to a lab and keeping track of
                 * all successful assignments in the meta maps labMeta and tutorMeta
                 *
                 * @param tutorId
                 * @param labId
                 */
                var assignTutorToLab = function (tutorId, labId) {

                  return new Promise(function(resolve, reject){

                    Lab.find(
                      { where: { id: labId } },
                      function (err, docs) {

                        if (err) {
                          return reject(err);
                        }
                        if (docs.length == 0) {
                          return reject(new Error('No Lab with id '+labId+' found'));
                        }

                        var lab = docs[0];
                        if (lab.tutorId) {
                          return reject(new Error('Lab with id '+labId+' is already assigned to tutor '+lab.tutorId));
                        }

                        lab.updateAttribute('tutorId', tutorId, function (err, instance) {

                          if (err) return reject(err);

                          var labMetaEntry = labMeta.get(labId);
                          labMetaEntry.assigned = true;
                          labMeta.set(labId, labMetaEntry);

                          var tutorMetaEntry = tutorMeta.get(tutorId);
                          tutorMetaEntry.labsAssigned += 1;
                          tutorMeta.set(tutorId, tutorMetaEntry);

                          console.log('Updated Lab instance '+instance.id+': tutorId = '+tutorId);

                          resolve(instance);
                        });
                      });
                  });
                };

                // Assign all labs with only one candidate first
                var singleCandidatePromises = [];
                labsForDistribution.forEach(function(lab){

                  var labMetaEntry = labMeta.get(lab.id.toString());
                  var labCandidates = (labMetaEntry) ? labMetaEntry.candidates : null;
                  if (labCandidates && labCandidates.length === 1) {
                    singleCandidatePromises.push(assignTutorToLab(labCandidates[0], lab.id.toString()));
                  }
                });
                var singleCandidateWrapperPromise = Promise.all(singleCandidatePromises);
                singleCandidateWrapperPromise.then(function(){

                  /**
                   * Private helper for choosing one of multiple possible tutors for a
                   * given Lab instance.
                   *
                   * @param labId - id of a Lab instance
                   */
                  var assignTutorFromCandidates = function (labId) {

                    var labMetaEntry = labMeta.get(labId);
                    if (labMetaEntry && !labMetaEntry.assigned) {

                      var candidateIds = labMetaEntry.candidates;

                      // Determine
                      // - a list of candidates for this lab that have less than the ideal
                      //   number of labs assigned
                      // - the candidate with the least number of labs assigned
                      var candidatesWithCapacity = [];
                      var rarestAppointedCandidateId = candidateIds[0];
                      candidateIds.forEach(function(candidateId){

                        var candidateMeta = tutorMeta.get(candidateId);
                        if (candidateMeta) {

                          if (candidateMeta.labsAssigned < idealNumberOfLabs) {
                            candidatesWithCapacity.push(candidateId); }
                          if (candidateMeta.labsAssigned < tutorMeta.get(rarestAppointedCandidateId).labsAssigned) {
                            rarestAppointedCandidateId = candidateId; }

                        } else {
                          throw new Error('No meta info for candidate '+candidateId+' found');
                        }
                      });

                      // Choose a tutor according to these rules:
                      // - if there is no candidate with capacity, choose the least appointed candidate
                      // - otherwise create a set that contains each candidate as many times as defined
                      //   by his compensationFactor and choose randomly from this set
                      var chosenTutorId;
                      if (candidatesWithCapacity.length === 0) {
                        chosenTutorId = rarestAppointedCandidateId;
                      } else {

                        var compensatedSetOfCandidates = [];
                        candidatesWithCapacity.forEach(function(candidateId){

                          for (var i=0; i<tutorMeta.get(candidateId).compensationFactor; i++) {
                            compensatedSetOfCandidates.push(candidateId);
                          }

                        });

                        shuffle(compensatedSetOfCandidates);
                        var randomIndex = Math.floor((Math.random() * compensatedSetOfCandidates.length));
                        chosenTutorId = compensatedSetOfCandidates[randomIndex];
                      }

                      // Assign the chosen tutor to the lab asynchronously
                      return assignTutorToLab(chosenTutorId, labId);
                    }
                  };

                  // Continue assigning the remaining labs
                  var multipleCandidatesPromises = [];
                  labsForDistribution.forEach(function(lab){

                    var labMetaEntry = labMeta.get(lab.id.toString());
                    if (labMetaEntry && !labMetaEntry.assigned) {
                      try {
                        multipleCandidatesPromises.push(
                          assignTutorFromCandidates(lab.id.toString())
                        );
                      } catch (e) {
                        next(e, null);
                        return;
                      }
                    }
                  });
                  var multipleCandidatesWrapperPromise = Promise.all(multipleCandidatesPromises);
                  multipleCandidatesWrapperPromise.then(

                    // success
                    function(){

                      labTypeInstance.updateAttribute('tutorsDistributed', true, function (err) {

                        if (err) throw err;

                        Lab.find({where: {labTypeId: labTypeId}}, function (err, labSearchResult) {

                          if (err) throw err;
                          if (labSearchResult.length == 0) {
                            next(new Error('LabType with id ' + labTypeId + ' has no associated Labs'), null);
                            return;
                          }

                          next(null, labSearchResult);
                          return;

                        });

                      });
                    },

                    // error
                    function(reason){
                      console.log(reason);
                      next(reason, null);
                      return;
                    });
                });
              });
          });
      });
    });
  };

  Labtype.remoteMethod('autoDistributeTutors',{
    accepts: [
      {arg: 'labTypeId', type: 'string'}
    ],
    returns: [
      {type: 'object', root: true}
    ]
  });

  Labtype.autoDistributeGroups = function (labTypeId, next) {

    var Lab = Labtype.app.models.Lab,
        Group = Labtype.app.models.Group,
        Priority = Labtype.app.models.Priority,

        labTypeInstance,
        labsForDistribution,
        groupsForDistribution,
        groupsForDistributionMap = new Map(),
        groupIds,
        priorityMappings,
        labMeta = new Map(),
        groupMeta = new Map();

    // Get specified LabType instance
    Labtype.find({where: {id: labTypeId}}, function(err, labTypeSearchResult){

      if (err) throw err;
      if (labTypeSearchResult.length === 0) {
        next(new Error('LabType with id '+labTypeId+' not found'), null);
        return;
      }

      labTypeInstance = labTypeSearchResult[0];
      if (!labTypeInstance.tutorsDistributed) {
        next(new Error('Group distribution denied. Tutors have not yet been distributed on this LabType.'), null);
        return;
      }

      // Get all Labs for this LabType instance
      Lab.find({where: {labTypeId: labTypeId}}, function (err, labSearchResult) {

        if (err) throw err;
        if (labSearchResult.length === 0) {
          next(new Error('No Labs with labTypeId '+labTypeId+' found'), null);
          return;
        }

        labsForDistribution = labSearchResult;

        // Get all Groups for this LabType's semester
        Group.find({where: {semesterId: labTypeInstance.semesterId}}, function (err, groupSearchResult) {

          if (err) {
            throw err;
          }
          if (groupSearchResult.length === 0) {
            next(new Error('No groups found for LabType\'s semester'), null);
            return;
          }

          groupsForDistribution = groupSearchResult;
          groupIds = groupsForDistribution.map(function(group){
            return group.id.toString();
          });

          // Get all priority mappings between groupsForDistribution and labsForDistribution
          Priority.find({
            where: {
              and: [
                {groupId: {inq: groupIds}},
                {labTypeId: labTypeId}
              ]
            }},
            function (err, prioritySearchResult){

              if (err) throw err;
              if (prioritySearchResult.length === 0) {
                next(new Error('No priority mappings found between LabType '+labTypeId
                               +' and groups of this semester'), null);
                return;
              }

              priorityMappings = prioritySearchResult;

              console.log('\nStarting auto distribution of groups for labTypeId '+labTypeId+'...');

              // Assemble labMeta map like this
              //
              // labMeta = Map {
              //   <<labId>> => {
              //     assigned: false,
              //     candidates: Map {
              //       0 => [ <<groupId>>, <<groupId>>, ... ],
              //       ...
              //     },
              //     hasTutor: true
              //   }
              // }
              labsForDistribution.forEach(function(lab){
                labMeta.set(lab.id.toString(), {
                  assigned: false,
                  candidates: new Map(),
                  hasTutor: (lab.tutorId) ? true : false
                });
              });

              priorityMappings.forEach(function(priority){
                var labId = priority.labId.toString(),
                    groupId = priority.groupId.toString(),
                    priorityValue = priority.priority,
                    labMetaEntry = labMeta.get(labId);

                if (labMetaEntry.candidates.get(priorityValue)) {
                  var candidatesForValue = labMetaEntry.candidates.get(priorityValue);
                  candidatesForValue.push(groupId);
                  labMetaEntry.candidates.set(priorityValue, candidatesForValue);
                } else {
                  labMetaEntry.candidates.set(priorityValue, [groupId]);
                }

                labMeta.set(labId, labMetaEntry);
              });

              // Assemble groupMeta map like this
              //
              // groupMeta = Map {
              //   <<groupId>> => {
              //     assigned: false
              //   }
              // }
              groupsForDistribution.forEach(function(group){
                groupMeta.set(group.id.toString(), {
                  assigned: false
                });
              });

              // Reset all affected Group and Lab models first
              var labIds = labsForDistribution.map(function(lab){
                return lab.id.toString();
              });
              Lab.updateAll(
                {labTypeId: labTypeId}, {groupId: null},
                function(err){

                  if (err) throw err;
                  groupsForDistribution.forEach(function(group, index){
                    var labsInGroup = group.labIds.map(function(id){ return id.toString(); });
                    var affectedLabsInGroup = intersection(labsInGroup, labIds);
                    group.updateAttribute('labIds',
                                          difference(labsInGroup, affectedLabsInGroup),
                                          function(err){
                                            if (err) throw err;
                                            // We're being asynch again
                                          });
                  });

                  console.log('All affected values have been reset');

                  // Execute distribution algorithm

                  // Determine lowest given priority value (highest integer)
                  var lowestPrio = 0;
                  labMeta.forEach(function(labMetaEntry){
                    labMetaEntry.candidates.forEach(function(val, key){
                      if (key > lowestPrio) {
                        lowestPrio = key;
                      }
                    });
                  });

                  /**
                   * Selects and returns a random element of a given array
                   *
                   * @param arrayOfElements
                   * @returns {*}
                   */
                  var selectRandom = function (arrayOfElements) {
                    if (arrayOfElements.length === 0) return null;
                    return arrayOfElements[Math.floor(Math.random()*arrayOfElements.length)];
                  };

                  /**
                   * Private helper for bidirectionally assigning a group to a lab
                   *
                   * @param groupId
                   * @param labId
                   * @returns {Promise} - resolved when all operations completed successfully
                   */
                  var assignGroupToLab = function (groupId, labId) {

                    var lab, group,
                        result = {
                          group: {},
                          lab: {}
                        };

                    return new Promise(function(resolve, reject){

                      Lab.find({where: {id: labId}}, function (err, labDocs){

                        if (err) return reject(err);
                        if (labDocs.length === 0) return reject(new Error('No lab with id '+labId+' found'));
                        lab = labDocs[0];

                        Group.find({where: {id: groupId}}, function (err, groupDocs) {

                          if (err) return reject(err);
                          if (groupDocs.length === 0) return reject(new Error('No group with id '+groupId+' found'));
                          group = groupDocs[0];

                          lab.updateAttribute('groupId', group.id, function(err, instance){

                            if (err) return reject(err);
                            result.lab = instance;

                            group.labs(null, function(err, labsOfGroup){

                              if (err) return reject(err);
                              var labIdsOfGroup = labsOfGroup.map(function(labObject){
                                return labObject.id;
                              });
                              labIdsOfGroup.push(lab.id);
                              group.updateAttribute('labIds', labIdsOfGroup, function(err, instance){
                                if (err) return reject(err);
                                result.group = instance;
                                resolve(result);
                              })
                            });
                          });
                        })
                      });
                    });
                  };

                  groupsForDistribution.forEach(function(group){
                    groupsForDistributionMap.set(group.id.toString(), group);
                  });

                  var prioIterator = 0;
                  var promises = [];
                  while (prioIterator <= lowestPrio) {

                    labsForDistribution.forEach(function(lab){

                      var labMetaEntry = labMeta.get(lab.id.toString());
                      if (labMetaEntry.hasTutor && !labMetaEntry.assigned) {

                        // assemble a list of candidates for current prio that have
                        // not been assigned to a lab yet
                        var candidateIds = labMetaEntry.candidates.get(prioIterator);
                        var unassignedCandidateIds = [];
                        if (candidateIds && candidateIds.length > 0) {
                          candidateIds.forEach(function(candidateId){
                            if (!groupMeta.get(candidateId).assigned) {
                              unassignedCandidateIds.push(candidateId);
                            }
                          });
                        }

                        // Choose a random group from this list of candidates
                        var chosenCandidateId;
                        if (unassignedCandidateIds.length > 0) {
                          chosenCandidateId = selectRandom(unassignedCandidateIds);

                          console.log('Assigning Group '+chosenCandidateId+' to Lab '+lab.id);

                          // Update meta maps
                          labMetaEntry.assigned = true;
                          labMeta.set(lab.id.toString(), labMetaEntry);
                          var groupMetaEntry = groupMeta.get(chosenCandidateId);
                          groupMetaEntry.assigned = true;
                          groupMeta.set(chosenCandidateId, groupMetaEntry);

                          // Store choice in lab and group
                          promises.push(
                            assignGroupToLab(chosenCandidateId.toString(), lab.id.toString())
                          );
                        }
                      }
                    });
                    prioIterator++;
                  }

                  // If possible, assign all remaining groups to a lab they didn't choose
                  var remainingLabs = labsForDistribution.filter(function(lab){
                    return !labMeta.get(lab.id.toString()).assigned;
                  });
                  var remainingGroups = groupsForDistribution.filter(function(group){
                    return !groupMeta.get(group.id.toString()).assigned;
                  });

                  while (remainingLabs.length > 0 && remainingGroups.length > 0) {
                    var labHead = remainingLabs.shift(),
                        groupHead = remainingGroups[0],
                        labMetaEntry = labMeta.get(labHead.id.toString());

                    if (labMetaEntry.hasTutor) {
                      console.log('Assigning Group '+groupHead.id+' to Lab '+labHead.id+
                                  ' even though this was not on their priority list');
                      promises.push(
                        assignGroupToLab(groupHead.id.toString(), labHead.id.toString())
                      );
                      remainingGroups.shift();
                    }
                  }

                  // wait for completion of all database operations
                  var wrapperPromise = Promise.all(promises);
                  wrapperPromise.then(

                    // success
                    function(){

                      labTypeInstance.updateAttribute('groupsDistributed', true, function(err){

                        if (err) throw err;

                        Lab.find({where: {labTypeId: labTypeId}}, function(err, labsForResponse){

                          if (err) throw err;
                          if (labsForResponse.length == 0) {
                            next(new Error('LabType with id ' + labTypeId + ' has no associated Labs'), null);
                            return;
                          }

                          next(null, labsForResponse);
                          return;
                        });

                      });
                    },

                    // error
                    function(reason){
                      console.log(reason);
                      next(reason, null);
                      return;
                    });
                });
            });
        });
      });
    });
  };

  Labtype.remoteMethod('autoDistributeGroups',{
    accepts: [
      {arg: 'labTypeId', type: 'string'}
    ],
    returns: [
      {type: 'object', root: true}
    ]
  });

};
