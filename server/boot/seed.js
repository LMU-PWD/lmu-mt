var semesters = [];
var uniqueDates = [];
var roles = [];
var platformUsers = [];
var groups = [];
var labtypes = [];
var labs = [];
var priorities = [];

module.exports = function (app) {

  // SEMESTER
  app.dataSources.mongo.automigrate('Semester', function (err) {
    if (err) throw err;

    console.log('\nSeeding DB with dummy data...');

    app.models.Semester.create([{
      "term": "WS 2016/2017",
      "start_date": "2016-09-10",
      "end_date": "2017-02-20",
      "group_size": 4
    }, {
      "term": "SS 2016",
      "start_date": "2016-04-01",
      "end_date": "2016-09-09",
      "group_size": 3
    }], function (err, documents) {
      if (err) throw err;
      console.log('Semester models created');
      semesters = semesters.concat(documents);
      seedUniqueDates(app);
    });
  });
};

// UNIQUE DATES
seedUniqueDates = function (app) {
  app.dataSources.mongo.automigrate('UniqueDate', function (err) {
    if (err) throw err;

    var testDate  = new Date("February 10, 2017 11:15:00");
    var testDate2 = new Date("March 15, 2017 11:15:00");
    var testDate3 = new Date("March 16, 2017 11:15:00");
    var testDate4 = new Date("March 17, 2017 11:15:00");
    var testDate5 = new Date("March 29, 2017 11:15:00");
    var testDate6 = new Date("April 30, 2017 11:15:00");
    app.models.UniqueDate.create([
      {
        "name": "Klausur",
        "date": testDate,
        "location": "Amalienstraße 67, Raum 001",
        "duration": "90",
        "description": "Semester Klausur  WS 2016/2017",
        "semesterId": semesters[0].id
      },{
        "name": "Wäsche waschen",
        "date": testDate6,
        "location": "Amalienstraße 67, Raum 001",
        "duration": "90",
        "description": "Semester Klausur  WS 2016/2017",
        "semesterId": semesters[0].id
      },{
        "name": "Oscarverleihung",
        "date": testDate2,
        "location": "Amalienstraße 67, Raum 001",
        "duration": "90",
        "description": "Semester Klausur  WS 2016/2017",
        "semesterId": semesters[0].id
      },{
        "name": "Klassenfahrt",
        "date": testDate3,
        "location": "Amalienstraße 67, Raum 001",
        "duration": "90",
        "description": "Semester Klausur  WS 2016/2017",
        "semesterId": semesters[0].id
      },{
        "name": "Abgabe Fotoprojekt",
        "date": testDate5,
        "location": "Amalienstraße 67, Raum 001",
        "duration": "90",
        "description": "Semester Klausur  WS 2016/2017",
        "semesterId": semesters[0].id
      },{
        "name": "Endlich Ferien",
        "date": testDate4,
        "location": "Amalienstraße 67, Raum 001",
        "duration": "90",
        "description": "Semester Klausur  WS 2016/2017",
        "semesterId": semesters[0].id
      }
    ], function (err, documents) {
      if (err) throw err;
      console.log('Unique date models created');
      uniqueDates = uniqueDates.concat(documents);
      seedRoles(app);
    });
  });
};

// ROLES
seedRoles = function (app) {
  app.dataSources.mongo.automigrate('Role', function (err) {

    if (err) throw err;

    app.models.Role.create([
      {name: 'tutor'},
      {name: 'admin'}
    ], function (err, documents) {

      if (err) throw err;

      console.log('User roles created');
      roles = roles.concat(documents);
      seedPendingPlatformUsers(app, documents[1]);

    });
  });
};


// PENDING PLATFORM USER
seedPendingPlatformUsers = function (app, adminRole) {
  app.dataSources.mongo.automigrate('PlatformUser', function (err) {

    app.dataSources.mongo.automigrate('PendingPlatformUser', function (err) {
      if (err) throw err;

      var semesterOneId = semesters[0].id;
      var semesterTwoId = semesters[1].id;

      app.models.PendingPlatformUser.create([

        // DEFAULT ADMIN
        {
          "name": "Medientechnik",
          "first_name": "Administrator",
          "isAdmin": true,
          "isTutor": true,
          "email": "admin@mt.medien.ifi.lmu.de",
          "semesterId": semesterOneId
        },

        // SEMESTER ONE - Group 1 Members
        {
          "name": "Mustermann",
          "first_name": "Max",
          "isAdmin": false,
          "isTutor": false,
          "email": "max.mustermann@campus.lmu.de",
          "semesterId": semesterOneId
        },
        {
          "name": "Wurst",
          "first_name": "Hans",
          "isAdmin": false,
          "isTutor": false,
          "email": "wursth@campus.lmu.de",
          "semesterId": semesterOneId
        },
        {
          "name": "Meier",
          "first_name": "Jeremy-Pascal",
          "isAdmin": false,
          "isTutor": false,
          "email": "jeremypascal@campus.lmu.de",
          "semesterId": semesterOneId
        },
        {
          "name": "Krüger",
          "first_name": "Dakota ",
          "isAdmin": false,
          "isTutor": false,
          "email": "dakota@campus.lmu.de",
          "semesterId": semesterOneId
        },

        // SEMESTER ONE - Registered users without a group
        {
          "name": "Meier",
          "first_name": "Josef-Jakob",
          "isAdmin": false,
          "isTutor": false,
          "email": "josefjakob@campus.lmu.de",
          "semesterId": semesterOneId
        },
        {
          "name": "Huber",
          "first_name": "Jacqueline",
          "isAdmin": false,
          "isTutor": false,
          "email": "jacky@campus.lmu.de",
          "semesterId": semesterOneId
        },
        {
          "name": "Meininger",
          "first_name": "Orlando",
          "isAdmin": false,
          "isTutor": false,
          "username": "orlando@campus.lmu.de",
          "email": "orlando@campus.lmu.de",
          "semesterId": semesterOneId
        },
        {
          "name": "di Lorenzo",
          "first_name": "Gianna",
          "isAdmin": false,
          "isTutor": false,
          "email": "gianna@campus.lmu.de",
          "semesterId": semesterOneId
        },

        // SEMESTER ONE - Pending users
        {
          "first_name": "Justin",
          "name": "Krämer",
          "email": "justin@campus.lmu.de",
          "isTutor": false,
          "semesterId": semesterOneId
        }, {
          "first_name": "Newt",
          "name": "Utor",
          "email": "newTutor@campus.lmu.de",
          "isTutor": true,
          "semesterId": semesterOneId
        }, {
          "first_name": "Adalbert",
          "name": "Minh",
          "email": "ad.minh@ifi.lmu.de",
          "isAdmin": true,
          "semesterId": semesterOneId
        },

        // SEMESTER ONE - Tutors
        {
          "name": "Dombrowsky",
          "first_name": "Kevin",
          "isAdmin": false,
          "isTutor": true,
          "email": "kevin@campus.lmu.de",
          "semesterId": semesterOneId
        },
        {
          "name": "Schmidt",
          "first_name": "Wilhelmina",
          "isAdmin": false,
          "isTutor": true,
          "email": "willischmidt@campus.lmu.de",
          "semesterId": semesterOneId
        },
        {
          "name": "Herberger",
          "first_name": "Sepp",
          "isAdmin": false,
          "isTutor": true,
          "email": "sepp@campus.lmu.de",
          "semesterId": semesterOneId
        },
        {
          "name": "Mittermeier",
          "first_name": "Rosi",
          "isAdmin": false,
          "isTutor": true,
          "email": "rosi@campus.lmu.de",
          "semesterId": semesterOneId
        },

        // SEMESTER TWO - Pending users
        {
          "name": "Himmel",
          "first_name": "Jens",
          "isAdmin": false,
          "isTutor": false,
          "email": "jens.himmel@campus.lmu.de",
          "semesterId": semesterTwoId
        },
        {
          "name": "Egger",
          "first_name": "Jennifer",
          "isAdmin": false,
          "isTutor": false,
          "email": "eggerj@campus.lmu.de",
          "semesterId": semesterTwoId
        },
        {
          "name": "Weiss",
          "first_name": "Benjamin",
          "isAdmin": false,
          "isTutor": false,
          "email": "weiss.b@campus.lmu.de",
          "semesterId": semesterTwoId
        },
        {
          "name": "Möller",
          "first_name": "Manuela",
          "isAdmin": false,
          "isTutor": false,
          "email": "moeller.manuela@campus.lmu.de",
          "semesterId": semesterTwoId
        },
        {
          "name": "Brandt",
          "first_name": "Bernd",
          "isAdmin": false,
          "isTutor": false,
          "email": "bbrandt@campus.lmu.de",
          "semesterId": semesterTwoId
        }
      ], function (err, documents) {

        if (err) throw err;
        console.log('PendingPlatformUser models created');

        seedPlatformUsers(app, adminRole);

      });
    });
  });
};


// PlatformUsers
seedPlatformUsers = function (app, adminrole) {
  app.dataSources.mongo.automigrate('PlatformUser', function (err) {
    if (err) throw err;

    var testDate = new Date("December 12, 2016 11:30:00");
    var dateIds = [];
    dateIds.push(uniqueDates[0].id);

    var tutorFreeDatesTest = [];
    tutorFreeDatesTest.push(testDate);

    app.models.PlatformUser.create(
      [
        /* This is the default admin user and should not be
         * deleted when going in production */
        {
          "name": "Medientechnik",
          "first_name": "Administrator",
          "isAdmin": true,
          "isTutor": true,
          "password": "mtadmin",
          "username": "mtadmin",
          "email": "admin@mt.medien.ifi.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "uniqueDateIds": [],
          "semesterId": ""
        },

        // SEMESTER ONE - Members of Group 1
        {
          "name": "Mustermann",
          "first_name": "Max",
          "isAdmin": false,
          "isTutor": false,
          "password": "test",
          "username": "max.mustermann@campus.lmu.de",
          "email": "max.mustermann@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "uniqueDateIds": dateIds,
          "semesterId": semesters[0].id
        },
        {
          "name": "Wurst",
          "first_name": "Hans",
          "isAdmin": false,
          "isTutor": false,
          "password": "test",
          "username": "wursth@campus.lmu.de",
          "email": "wursth@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id

        },
        {
          "name": "Meier",
          "first_name": "Jeremy-Pascal",
          "isAdmin": false,
          "isTutor": false,
          "password": "test",
          "username": "jeremypascal@campus.lmu.de",
          "email": "jeremypascal@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        },
        {
          "name": "Krüger",
          "first_name": "Dakota ",
          "isAdmin": false,
          "isTutor": false,
          "password": "test",
          "username": "dakota@campus.lmu.de",
          "email": "dakota@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        },

        // SEMESTER ONE - Tutors
        {
          "name": "Dombrowsky",
          "first_name": "Kevin",
          "isAdmin": false,
          "isTutor": true,
          "free_tutor_dates": tutorFreeDatesTest,
          "password": "test",
          "username": "kevin@campus.lmu.de",
          "email": "kevin@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        },
        {
          "name": "Schmidt",
          "first_name": "Wilhelmina",
          "isAdmin": false,
          "isTutor": true,
          "password": "test",
          "username": "willischmidt@campus.lmu.de",
          "email": "willischmidt@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        },
        {
          "name": "Herberger",
          "first_name": "Sepp",
          "isAdmin": false,
          "isTutor": true,
          "password": "test",
          "username": "sepp@campus.lmu.de",
          "email": "sepp@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        },
        {
          "name": "Mittermeier",
          "first_name": "Rosi",
          "isAdmin": false,
          "isTutor": true,
          "password": "test",
          "username": "rosi@campus.lmu.de",
          "email": "rosi@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        },

        // SEMESTER ONE - Registered users without a group
        {
          "name": "Meier",
          "first_name": "Josef-Jakob",
          "isAdmin": false,
          "isTutor": false,
          "password": "test",
          "username": "josefjakob@campus.lmu.de",
          "email": "josefjakob@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        },
        {
          "name": "Huber",
          "first_name": "Jacqueline",
          "isAdmin": false,
          "isTutor": false,
          "password": "test",
          "username": "jacky@campus.lmu.de",
          "email": "jacky@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        },
        {
          "name": "Meininger",
          "first_name": "Orlando",
          "isAdmin": false,
          "isTutor": false,
          "password": "test",
          "username": "orlando@campus.lmu.de",
          "email": "orlando@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        },
        {
          "name": "di Lorenzo",
          "first_name": "Gianna",
          "isAdmin": false,
          "isTutor": false,
          "password": "test",
          "username": "gianna@campus.lmu.de",
          "email": "gianna@campus.lmu.de",
          "emailVerified": true,
          "created": testDate,
          "lastUpdated": testDate,
          "semesterId": semesters[0].id
        }

      ], function (err, documents) {
        if (err) throw err;
        console.log('User models created');
        platformUsers = platformUsers.concat(documents);

        /* Assign admin role to default admin user.
         * Do not delete when going in production. */
        /*adminrole.principals.create({
         principalType: app.models.RoleMapping.USER,
         principalId: documents[0].id
         }, function (err, principal) {
         if (err) throw err;
         console.log('Assigned admin role');*/
        seedExercise(app);
        //});
      });
  });
};


// EXERCISE
seedExercise = function (app) {
  app.dataSources.mongo.automigrate('Exercise', function (err) {
    if (err) throw err;

    var members = [];
    members.push(platformUsers[0].id);
    members.push(platformUsers[1].id);
    members.push(platformUsers[2].id);
    members.push(platformUsers[3].id);
    var testDate = new Date("December 12, 2016 11:30:00");
    app.models.Exercise.create([
      {
        "name": "Übungsgruppe 1",
        "date": testDate,
        "semesterId": semesters[0].id,
        "location": "Amalienstraße 17",
        "participantsUserIds": members
      }, {
        "name": "Übungsgruppe 1",
        "date": testDate,
        "semesterId": semesters[0].id,
        "location": "Amalienstraße 17",
        "participantsUserIds": []
      }
    ], function (err, documents) {
      if (err) throw err;
      console.log('Exercise models created');
      seedGroups(app);
    });
  });
};


// GROUP
seedGroups = function (app) {
  app.dataSources.mongo.automigrate('Group', function (err) {
    if (err) throw err;

    var members = [];
    members.push(platformUsers[1].id);
    members.push(platformUsers[2].id);
    members.push(platformUsers[3].id);
    members.push(platformUsers[4].id);

    var labIds;

    app.models.Group.create({
      "name": "Medienchaoten",
      "groupMemberIds": members,
      "semesterId": semesters[0].id
    }, function (err, documents) {
      if (err) throw err;
      console.log('Group models created');
      groups = groups.concat(documents);

      for (var i = 0; i < members.length; i++) {

        app.models.PlatformUser.updateAll(
          {"id": platformUsers[i + 1].id},
          {"groupId": groups[0].id},
          function (err, info) {
            if (err) throw err;
            // Do nothing - should be ok to update this async
          });
      }

      seedLabType(app);

    });
  });
};


// LABTYPE
seedLabType = function (app) {
  app.dataSources.mongo.automigrate('LabType', function (err) {
    if (err) throw err;
    var testDate = new Date("April 14, 2017 11:26:00");
    var testDate2 = new Date("April 30, 2017 18:30:00");
    var testDate3 = new Date("May 14, 2017 18:30:00");
    var testDate4 = new Date("May 30, 2017 18:30:00");
    var testDate5 = new Date("June 14, 2017 18:30:00");
    var testDate6 = new Date("June 30, 2017 18:30:00");
    app.models.LabType.create([
      {
        "type": "1",
        "type_str": "Foto",
        "registration_open": true,
        "registration_deadline": testDate2,
        "registration_deadline_tutors": testDate,
        "description_tutor": "Beschreibung Tutor",
        "description_student": "Beschreibung Student",
        "semesterId": semesters[0].id
      },
      {
        "type": "2",
        "type_str": "Video",
        "registration_open": true,
        "registration_deadline": testDate4,
        "registration_deadline_tutors": testDate3,
        "description_tutor": "Beschreibung Tutor",
        "description_student": "Beschreibung Student",
        "semesterId": semesters[0].id
      },
      {
        "type": "3",
        "type_str": "Audio",
        "registration_open": true,
        "registration_deadline": testDate6,
        "registration_deadline_tutors": testDate5,
        "description_tutor": "Beschreibung Tutor",
        "description_student": "Beschreibung Student",
        "semesterId": semesters[0].id
      },
      {
        "type": "4",
        "type_str": "Videoschnitt",
        "registration_open": true,
        "registration_deadline": testDate4,
        "registration_deadline_tutors": testDate3,
        "description_tutor": "Beschreibung Tutor",
        "description_student": "Beschreibung Student",
        "semesterId": semesters[0].id
      }
    ], function (err, documents) {
      if (err) throw err;
      console.log('LabType models created');
      labtypes = labtypes.concat(documents);
      seedLab(app);

    });
  });
};

// LAB
seedLab = function (app) {
  app.dataSources.mongo.automigrate('Lab', function (err) {
    if (err) throw err;
    var testDate = new Date("October 31, 2016 16:00:00");

    var labEntities = [];
    labEntities.unshift({
      "date": testDate,
      "duration": "120",
      "location": "Amalienstraße 17",
      "passed": false,
      "groupId": groups[0].id,
      "labTypeId": labtypes[0].id,
      "semesterId": semesters[0].id
    });

    app.models.Lab.create(labEntities, function (err, documents) {
      if (err) throw err;
      console.log('Lab models created');

      labs = labs.concat(documents);
      var labIds = labs.map(function (lab) {
        return lab.id;
      });

      // Statically create Relation sample group to sample lab
      app.models.Group.updateAll({"id": groups[0].id}, {"labIds": [labIds[0]]}, function (err, info) {
        if (err) throw err;
        // This happens asynchronously
      });

      // Assume all goes well in the for each loop above and continue
      seedPriority(app);

    });
  });
};

// PRIORITY
seedPriority = function (app) {
  app.dataSources.mongo.automigrate('Priority', function (err) {
    if (err) throw err;

    app.models.Priority.create({
      "priority": 1,
      "groupId": groups[0].id,
      "labId": labs[0].id,
      "semesterId": semesters[0].id
    }, function (err, documents) {
      if (err) throw err;
      console.log('Priority models created');

      priorities.push(documents);

      var testPriorities = [];
      testPriorities.push(documents.id);

      // Add a priority to a group
      app.models.Group.updateAll({"id": groups[0].id}, {"priorityIds": testPriorities}, function (err, info) {

        generateSemesterScenario(app);

      });

    });
  });
};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * Generate large scale test data for distribution algorithm * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Returns a random subset of an array
 * @param array
 * @returns {Array}
 */
function randomSubset(array) {
  var subsetLength = Math.floor(Math.random() * array.length);
  var index = 0, subset = [];
  while (index < subsetLength) {
    var nextSubsetElement = array[Math.floor(Math.random() * array.length)];
    while (subset.indexOf(nextSubsetElement) >= 0) {
      nextSubsetElement = array[Math.floor(Math.random() * array.length)];
    }
    subset.push(nextSubsetElement);
    index++;
  }
  return subset;
}

/**
 * Generates a random sequence of latin letters. Length ranges from 4 to 15 letters.
 *
 * @param {boolean} uppercase - start with an uppercase letter
 * @returns {string}
 */
function randomName(capitalize) {
  var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var lowercase = 'abcdefghijklmnopqrstuvwxyz';
  var numLowercaseLetters = Math.floor(Math.random() * 10 + 4);
  var name = '';
  if (capitalize) {
    name += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  }
  var index = 0;
  while (index < numLowercaseLetters) {
    name += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    index++;
  }
  return name;
}

/**
 * Generates a list of random PlatformUser-like objects representing a set of students
 *
 * @param numberOfStudents - number of students to be created
 * @param semesterId - ID of semester that students will belong to
 */
function generateStudents(numberOfStudents, semesterId) {
  var index = 0, students = [];
  while (index < numberOfStudents) {
    students.push({
      "name": randomName(true),
      "first_name": randomName(true),
      "email": randomName(false) + '@campus.lmu.de',
      "semesterId": semesterId
    });
    index++;
  }
  return students;
}

/**
 * Generates a list of Priority-like objects representing a random choice of labs for a given group
 *
 * @param group - the group instance for which the priorities are generated
 * @param labIds - a list of possible choices for the group
 * @param numberOfPriorities - number of priorities that will be chosen
 * @returns {Array}
 */
function generateRandomPriorities(group, labIds, numberOfPriorities) {
  if (numberOfPriorities > labIds.length) {
    throw new Error('numberOfPriorities (' + numberOfPriorities + ') out of bounds. Cannot choose more ' +
      'priorities than labIds provided (' + labIds.length + ')');
    return;
  }
  var index = 0, chosenLabIds = [];
  while (index < numberOfPriorities) {
    var nextLabId = labIds[Math.floor(Math.random() * labIds.length)];
    while (chosenLabIds.indexOf(nextLabId) >= 0) {
      nextLabId = labIds[Math.floor(Math.random() * labIds.length)];
    }
    chosenLabIds.push(nextLabId);
    index++;
  }
  return chosenLabIds.map(function (id, index) {
    return {
      groupId: group.id,
      labId: id,
      priority: index,
      semesterId: group.semesterId
    };
  });
}

generateSemesterScenario = function (app) {

  var scenarioSemester = semesters[0],
    scenarioStudents,
    scenarioGroups;

  console.log('\nGenerating semester scenario for semester ' + scenarioSemester.id + '...');

  // Generate Labs
  var testDatesPhoto = [], testDatesVideo = [], testDatesCutting = [], testDatesAudio = [];
  var iteratorDatePhoto   = new Date(2017, 4, 1, 8); // May 1, 2017 8:00:00
  var iteratorDateVideo   = new Date(2017, 5, 1, 8); // June 1, 2017 8:00:00
  var iteratorDateCutting = new Date(2017, 5, 1, 8); // June 1, 2017 8:00:00
  var iteratorDateAudio   = new Date(2017, 6, 1, 8); // July 1, 2017 8:00:00
  for (var i = 0; i < 20; i++) {
    testDatesPhoto[i] = new Date(iteratorDatePhoto);
    testDatesVideo[i] = new Date(iteratorDateVideo);
    testDatesCutting[i] = new Date(iteratorDateCutting);
    testDatesAudio[i] = new Date(iteratorDateAudio);
    iteratorDatePhoto.setHours(iteratorDatePhoto.getHours() + 2);
    iteratorDateVideo.setHours(iteratorDateVideo.getHours() + 2);
    iteratorDateCutting.setHours(iteratorDateCutting.getHours() + 2);
    iteratorDateAudio.setHours(iteratorDateAudio.getHours() + 2);
  }

  var labEntitiesPhoto = testDatesPhoto.map(function (date) {
    return {
      "date": date,
      "duration": "120",
      "location": "Amalienstraße 17",
      "passed": false,
      "labTypeId": labtypes[0].id,
      "semesterId": scenarioSemester.id
    };
  });
  var labEntitiesVideo = testDatesVideo.map(function (date) {
    return {
      "date": date,
      "duration": "120",
      "location": "Amalienstraße 17",
      "passed": false,
      "labTypeId": labtypes[1].id,
      "semesterId": scenarioSemester.id
    };
  });
  var labEntitiesAudio = testDatesAudio.map(function (date) {
    return {
      "date": date,
      "duration": "120",
      "location": "Amalienstraße 17",
      "passed": false,
      "labTypeId": labtypes[2].id,
      "semesterId": scenarioSemester.id
    };
  });
  var labEntitiesCutting = testDatesCutting.map(function (date) {
    return {
      "date": date,
      "duration": "120",
      "location": "Amalienstraße 17",
      "passed": false,
      "labTypeId": labtypes[3].id,
      "semesterId": scenarioSemester.id
    };
  });
  labEntitiesCutting = labEntitiesCutting.concat(labEntitiesCutting,
    labEntitiesCutting, labEntitiesCutting, labEntitiesCutting, labEntitiesCutting);
  var labEntities = labEntitiesPhoto.concat(labEntitiesVideo, labEntitiesAudio, labEntitiesCutting);

  app.models.Lab.create(labEntities, function (err, documents) {

    if (err) throw err;
    labs = labs.concat(documents);
    console.log(documents.length + ' Labs created');

    var labIds = labs.map(function (lab) {
      return lab.id;
    });

    // Randomly choose tutorPossibleLabs
    var tutors = [platformUsers[5], platformUsers[6], platformUsers[7], platformUsers[8]];
    var photoLabIds = labIds.slice(1, 21);
    var videoLabIds = labIds.slice(21, 41);
    var audioLabIds = labIds.slice(41, 61);
    tutors.forEach(function (tutor) {
      var possibleLabIdsPhoto = randomSubset(photoLabIds);
      var possibleLabIdsVideo = randomSubset(videoLabIds);
      var possibleLabIdsAudio = randomSubset(audioLabIds);
      var possibleLabIds = possibleLabIdsPhoto.concat(possibleLabIdsVideo, possibleLabIdsAudio);
      app.models.PlatformUser.updateAll(
        {"id": tutor.id},
        {"tutorPossibleLabs": possibleLabIds},
        function (err) {
          if (err) throw err;
          // Let's be asynch again
        }
      );
    });

    console.log('Random tutorPossibleLabs assigned');

    // Generate students
    var pendingStudentObjects = generateStudents(48, scenarioSemester.id);
    app.models.PendingPlatformUser.create(pendingStudentObjects, function (err) {

      if (err) throw err;

      var studentObjects = pendingStudentObjects.map(function (pendingObject) {
        var updatedEntry = pendingObject;
        updatedEntry.password = 'test';
        return updatedEntry;
      });
      app.models.PlatformUser.create(studentObjects, function (err, createdStudents) {

        if (err) throw err;
        scenarioStudents = createdStudents;
        console.log(scenarioStudents.length + ' PlatformUsers created');

        // Generate groups
        var numberOfGroups = Math.floor(scenarioStudents.length / 4);
        var groupMemberIds = [], groupIndex = 0;
        while (groupIndex < numberOfGroups) {
          var firstStudentIndex = groupIndex * 4;
          groupMemberIds[groupIndex] = [
            scenarioStudents[firstStudentIndex].id,
            scenarioStudents[firstStudentIndex + 1].id,
            scenarioStudents[firstStudentIndex + 2].id,
            scenarioStudents[firstStudentIndex + 3].id
          ];
          groupIndex++;
        }
        var groupObjects = groupMemberIds.map(function (memberList) {
          return {
            "name": randomName(true),
            "groupMemberIds": memberList,
            "semesterId": scenarioSemester.id
          };
        });
        app.models.Group.create(groupObjects, function (err, createdGroups) {

          if (err) throw err;
          scenarioGroups = createdGroups;
          console.log(scenarioGroups.length + ' Groups created');

          // Generate priority mappings for all groups
          var priorityObjects = [];
          scenarioGroups.forEach(function (group) {
            priorityObjects = priorityObjects.concat(generateRandomPriorities(group, photoLabIds, 2));
            priorityObjects = priorityObjects.concat(generateRandomPriorities(group, videoLabIds, 2));
            priorityObjects = priorityObjects.concat(generateRandomPriorities(group, audioLabIds, 2));
          });


          // Link Priority Objects to Groups.
          var index = 0;
          for (var i = 0; i < priorityObjects.length; i++) {

            // This is needed to avoid a weird race-condition (Lost Update), which happens when the Priority Objects are
            // seeded too fast.
            setTimeout(function () {
              app.models.Priority.create(priorityObjects[index], function (err, created) {
                if (err) {
                  console.log(priorityObjects[index]);
                  throw err;
                  return;
                }
                if(index == priorityObjects.length-1){
                  console.log((index+1)+' Priorities created');
                  console.log('\nSeeding of the DB finished');
                }
              });
              index++;

            }, 100 * i);

          }

        });
      });
    });
  });
};

