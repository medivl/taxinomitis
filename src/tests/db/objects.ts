/*eslint-env mocha */
import * as assert from 'assert';
import * as uuid from 'uuid/v1';
import * as randomstring from 'randomstring';

import * as dbobjects from '../../lib/db/objects';
import * as Objects from '../../lib/db/db-types';



describe('DB objects', () => {

    describe('getProjectFromDbRow()', () => {
        it('should return labels for ids from DB', () => {
            const userid = 'testuser';
            const classid = 'testclass';
            const projectid = uuid();

            const testRow: Objects.ProjectDbRow = {
                id : projectid,
                userid, classid,
                language : 'ar',
                typeid : 2,
                name : 'testproject',
                labels : '',
                numfields : 2,
                fields : [
                    { id : uuid(), userid, classid, projectid, name : 'first', fieldtype : 1, choices : undefined },
                    { id : uuid(), userid, classid, projectid, name : 'second', fieldtype : 1, choices : undefined },
                ],
            };

            const testProject: Objects.Project = dbobjects.getProjectFromDbRow(testRow);

            assert.equal(testProject.type, 'numbers');
            assert.deepEqual(testProject.fields, [
                { type : 'number', name : 'first', choices : [] },
                { type : 'number', name : 'second', choices : [] },
            ]);
        });

        it('should default language to English if unspecified', () => {
            const userid = 'testuser';
            const classid = 'testclass';
            const projectid = uuid();

            const testRow: Objects.ProjectDbRow = {
                id : projectid,
                userid, classid,
                typeid : 1,
                language : undefined,
                name : 'testproject',
                labels : '',
                numfields : 0,
                fields : [],
            };

            const testProject: Objects.Project = dbobjects.getProjectFromDbRow(testRow);

            assert.equal(testProject.type, 'text');
            assert.equal(testProject.language, 'en');
        });
    });

    describe('createLabel', () => {

        it('should remove spaces', () => {
            assert.equal(dbobjects.createLabel('One Two Three'),
                         'One_Two_Three');
        });

        it('should remove special characters', () => {
            assert.equal(dbobjects.createLabel('It\'s over here?'),
                         'It_s_over_here_');
        });

        it('should remove hyphens', () => {
            assert.equal(dbobjects.createLabel('Science-Fiction'),
                         'Science_Fiction');
        });

        it('should remove slashes', () => {
            assert.equal(dbobjects.createLabel('Forward/Backward\\Pipe|'),
                         'Forward_Backward_Pipe_');
        });

        it('should remove quotes', () => {
            assert.equal(dbobjects.createLabel('Single\'s "doubles" and `ticks`'),
                         'Single_s__doubles__and__ticks_');
        });

        it('should remove brackets', () => {
            assert.equal(dbobjects.createLabel('This (and) [the] other'),
                         'This__and___the__other');
        });

        it('should remove wildcard characters', () => {
            assert.equal(dbobjects.createLabel('$2 * $3'),
                         '_2____3');
        });


    });


    describe('getClassFromDbRow()', () => {
        it('should return tenant policy info', () => {
            const testRow: Objects.ClassDbRow = {
                id : uuid(),
                projecttypes : 'text,numbers',
                ismanaged : 0,
                maxusers : 3,
                maxprojectsperuser : 2,
                textclassifiersexpiry : 9,
                imageclassifiersexpiry : 1,
            };
            const expectedPolicy: Objects.ClassTenant = {
                id : testRow.id,
                supportedProjectTypes : ['text', 'numbers'],
                isManaged : false,
                maxUsers : 3,
                maxProjectsPerUser : 2,
                textClassifierExpiry : 9,
                imageClassifierExpiry : 1,
            };

            assert.deepEqual(dbobjects.getClassFromDbRow(testRow), expectedPolicy);
        });
    });


    describe('getTextTrainingFromDbRow()', () => {
        it('should return training info', () => {
            const testRow: Objects.TextTrainingDbRow = {
                id : uuid(),
                textdata : uuid(),
            };
            const expectedTraining: Objects.TextTraining = {
                id : testRow.id,
                textdata : testRow.textdata,
            };

            assert.deepEqual(dbobjects.getTextTrainingFromDbRow(testRow), expectedTraining);
        });
    });


    describe('getNumberTrainingFromDbRow()', () => {
        it('should return training data', () => {
            const testRow: Objects.NumberTrainingDbRow = {
                id : uuid(),
                numberdata : '1,3,4.3,-5.1,9.3214,0.1',
            };
            const expectedTraining: Objects.NumberTraining = {
                id : testRow.id,
                numberdata : [ 1, 3, 4.3, -5.1, 9.3214, 0.1 ],
            };

            assert.deepEqual(dbobjects.getNumberTrainingFromDbRow(testRow), expectedTraining);
        });

        it('should return training data with labels', () => {
            const testRow: Objects.NumberTrainingDbRow = {
                id : uuid(),
                numberdata : '1,11,0.9,80',
                label : 'mylabel',
                projectid : uuid(),
            };
            const expectedTraining: Objects.NumberTraining = {
                id : testRow.id,
                numberdata : [ 1, 11, 0.9, 80 ],
                label : 'mylabel',
                projectid : testRow.projectid,
            };

            assert.deepEqual(dbobjects.getNumberTrainingFromDbRow(testRow), expectedTraining);
        });
    });


    describe('getImageTrainingFromDbRow()', () => {
        it('should return training data', () => {
            const testRow: Objects.ImageTrainingDbRow = {
                id : uuid(),
                imageurl : 'http://images.com/example/image1.jpg',
                projectid : 'testproject',
            };
            const expectedTraining: Objects.ImageTraining = {
                id : testRow.id,
                imageurl : testRow.imageurl,
                projectid : 'testproject',
            };

            assert.deepEqual(dbobjects.getImageTrainingFromDbRow(testRow), expectedTraining);
        });
    });



    describe('getLabelListFromArray()', () => {

        it('should protect against long lists', () => {
            const labelsList = [];
            for (let i = 0; i < 50; i++) {
                labelsList.push(randomstring.generate({ length : 12 }));
            }
            try {
                dbobjects.getLabelListFromArray(labelsList);
                assert.fail(0, 1, 'Should not have reached here', '');
            }
            catch (err) {
                assert.equal(err.message, 'No room for the label');
            }
        });

    });


    describe('getLabelsFromList()', () => {
        it('should handle empty lists', () => {
            assert.deepEqual(dbobjects.getLabelsFromList(''), [ ]);
        });
        it('should remove empty items', () => {
            assert.deepEqual(dbobjects.getLabelsFromList('apple,,banana'), [ 'apple', 'banana' ]);
        });
        it('should trim items', () => {
            assert.deepEqual(dbobjects.getLabelsFromList('apple,  ,banana , cabbage'),
                             [ 'apple', 'banana', 'cabbage' ]);
        });
    });


    describe('createProject()', () => {
        it('should reject invalid project types', (done) => {
            try {
                dbobjects.createProject('bob', 'bobclass', 'invalidtype', 'projectname', 'en', []);
            }
            catch (err) {
                assert.equal(err.message, 'Invalid project type invalidtype');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should require user id', (done) => {
            try {
                dbobjects.createProject('', 'myclass', 'text', 'projectname', 'en', []);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should require class id', (done) => {
            try {
                dbobjects.createProject('bob', '', 'text', 'projectname', 'en', []);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should require project name', (done) => {
            try {
                dbobjects.createProject('bob', 'bobclass', 'text', undefined, 'en', []);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should require a language', (done) => {
            try {
                dbobjects.createProject('bob', 'bobclass', 'text', 'project', undefined, []);
            }
            catch (err) {
                assert.equal(err.message, 'Language not supported');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should require a valid language', (done) => {
            try {
                dbobjects.createProject('bob', 'bobclass', 'text', 'project', 'xxx' as Objects.TextProjectLanguage, []);
            }
            catch (err) {
                assert.equal(err.message, 'Language not supported');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should create a project object', () => {
            const project = dbobjects.createProject('testuser', 'testclass', 'text', 'testproject', 'de', []);
            assert(project.id);
            assert.equal(project.name, 'testproject');
            assert.equal(project.classid, 'testclass');
            assert.equal(project.typeid, 1);
            assert.equal(project.userid, 'testuser');
            assert.equal(project.language, 'de');
        });

        it('should need options for multichoice fields in numbers projects', (done) => {
            try {
                const field: Objects.NumbersProjectFieldSummary = { name : 'a', type : 'multichoice' };
                dbobjects.createProject('testuser', 'testclass', 'numbers', 'testproject', 'en', [ field ]);
            }
            catch (err) {
                assert.equal(err.message, 'Not enough choices provided');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should need enough options for multichoice fields in numbers projects', (done) => {
            try {
                const field: Objects.NumbersProjectFieldSummary = {
                    name : 'a', type : 'multichoice', choices : [ 'onlyone' ],
                };
                dbobjects.createProject('testuser', 'testclass', 'numbers', 'testproject', 'en', [ field ]);
            }
            catch (err) {
                assert.equal(err.message, 'Not enough choices provided');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should prevent too many options for multichoice fields in numbers projects', (done) => {
            try {
                const field: Objects.NumbersProjectFieldSummary = {
                    name : 'a', type : 'multichoice',
                    choices : [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm' ],
                };
                dbobjects.createProject('testuser', 'testclass', 'numbers', 'testproject', 'en', [ field ]);
            }
            catch (err) {
                assert.equal(err.message, 'Too many choices specified');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should prevent empty options for multichoice fields in numbers projects', (done) => {
            try {
                const field: Objects.NumbersProjectFieldSummary = {
                    name : 'a', type : 'multichoice',
                    choices : [ 'a', '', 'c' ],
                };
                dbobjects.createProject('testuser', 'testclass', 'numbers', 'testproject', 'en', [ field ]);
            }
            catch (err) {
                assert.equal(err.message, 'Invalid choice value');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should prevent choices that start with numbers in numbers projects', (done) => {
            try {
                const field: Objects.NumbersProjectFieldSummary = {
                    name : 'a', type : 'multichoice',
                    choices : [ 'a', '1Boo' ],
                };
                dbobjects.createProject('testuser', 'testclass', 'numbers', 'testproject', 'en', [ field ]);
            }
            catch (err) {
                assert.equal(err.message, 'Invalid choice value');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should prevent commas in choices in multichoice fields in numbers projects', (done) => {
            try {
                const field: Objects.NumbersProjectFieldSummary = {
                    name : 'a', type : 'multichoice',
                    choices : [ 'a', 'This , Should', 'c' ],
                };
                dbobjects.createProject('testuser', 'testclass', 'numbers', 'testproject', 'en', [ field ]);
            }
            catch (err) {
                assert.equal(err.message, 'Invalid choice value');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should prevent over long options for multichoice fields in numbers projects', (done) => {
            try {
                const field: Objects.NumbersProjectFieldSummary = {
                    name : 'a', type : 'multichoice',
                    choices : [ 'a', 'This Is A Stupidly Long Option To Include', 'c' ],
                };
                dbobjects.createProject('testuser', 'testclass', 'numbers', 'testproject', 'en', [ field ]);
            }
            catch (err) {
                assert.equal(err.message, 'Invalid choice value');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should limit the number of fields for numbers projects', (done) => {
            try {
                dbobjects.createProject('testuser', 'testclass', 'numbers', 'testproject', 'en',
                    [
                        { name : 'a', type : 'number' }, { name : 'b', type : 'number' },
                        { name : 'c', type : 'number' }, { name : 'd', type : 'number' },
                        { name : 'e', type : 'number' }, { name : 'f', type : 'number' },
                        { name : 'g', type : 'number' }, { name : 'h', type : 'number' },
                        { name : 'i', type : 'number' }, { name : 'j', type : 'number' },
                        { name : 'k', type : 'number' }, { name : 'l', type : 'number' },
                        { name : 'm', type : 'number' }, { name : 'n', type : 'number' },
                    ]);
            }
            catch (err) {
                assert.equal(err.message, 'Too many fields specified');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });

        it('should restrict fields to numbers projects', (done) => {
            try {
                dbobjects.createProject('testuser', 'testclass', 'text', 'testproject', 'en', [
                    { name : 'a', type : 'number' }, { name : 'b', type : 'number' },
                    { name : 'c', type : 'number' },
                ]);
            }
            catch (err) {
                assert.equal(err.message, 'Fields not supported for non-numbers projects');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject project', '');
        });


        it('should prepare numbers projects', () => {
            const project = dbobjects.createProject('testuser', 'testclass', 'numbers', 'testproject', 'en', [
                { name : 'a', type : 'number' }, { name : 'b', type : 'number' },
                { name : 'c', type : 'number' },
                { name : 'd', type : 'multichoice', choices : [ 'left', 'right' ] },
            ]);

            assert(project.id);
            assert.equal(project.classid, 'testclass');
            assert.equal(project.labels, '');
            assert.equal(project.name, 'testproject');
            assert.equal(project.numfields, 4);
            assert.equal(project.fields.length, 4);
            assert.equal(project.typeid, 2);
            assert.equal(project.userid, 'testuser');
            project.fields.forEach((field) => {
                assert(field.id);
                assert.equal(field.classid, 'testclass');
                assert.equal(field.userid, 'testuser');
                assert.equal(field.projectid, project.id);
            });
            assert.equal(project.fields[0].fieldtype, 1);
            assert.equal(project.fields[1].fieldtype, 1);
            assert.equal(project.fields[2].fieldtype, 1);
            assert.equal(project.fields[3].fieldtype, 2);
            assert.equal(project.fields[3].choices, 'left,right');
        });
    });


    describe('createTextTraining()', () => {
        it('should require project id', (done) => {
            try {
                dbobjects.createTextTraining('', 'text', 'label');
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });

        it('should require text data', (done) => {
            try {
                dbobjects.createTextTraining('testproject', undefined, undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });

        it('should remove tabs from text data', () => {
            const training = dbobjects.createTextTraining('testproject',
                'This should	include a tab. Do not remove	it.', 'mylabel');
            assert.equal(training.textdata, 'This should include a tab. Do not remove it.');
        });

        it('should remove new lines from text data', () => {
            const training = dbobjects.createTextTraining('testproject',
                'This should include a new line.\nDo not remove it.', 'mylabel');
            assert.equal(training.textdata, 'This should include a new line. Do not remove it.');
        });

        it('should allow training data without labels', () => {
            const training = dbobjects.createTextTraining('testproject', 'mytext', undefined);
            assert(training.id);
            assert.equal(training.projectid, 'testproject');
            assert.equal(training.textdata, 'mytext');
        });

        it('should create training data objects', () => {
            const training = dbobjects.createTextTraining('testproject', 'mytext', 'mylabel');
            assert(training.id);
            assert.equal(training.projectid, 'testproject');
            assert.equal(training.textdata, 'mytext');
            assert.equal(training.label, 'mylabel');
        });
    });


    describe('createNumberTraining()', () => {
        it('should require project id', (done) => {
            try {
                dbobjects.createNumberTraining('', [1], 'label');
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });

        it('should require number data', (done) => {
            try {
                dbobjects.createNumberTraining('testproject', undefined, undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });

        it('should require at least one number data item', (done) => {
            try {
                dbobjects.createNumberTraining('testproject', [], undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });

        it('should require valid number data', (done) => {
            try {
                dbobjects.createNumberTraining('testproject', [10, 'HELLO', 34] as any, undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Data contains non-numeric items');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });

        it('should allow training data without labels', () => {
            const training = dbobjects.createNumberTraining('testproject', [123, 456], undefined);
            assert(training.id);
            assert.equal(training.projectid, 'testproject');
            assert.deepEqual(training.numberdata, [123, 456]);
        });

        it('should limit the number of training data objects', (done) => {
            try {
                dbobjects.createNumberTraining(
                    'testproject',
                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                    'mylabel');
                assert.fail(0, 1, 'Should not have allowed this', '');
            }
            catch (err) {
                assert.equal(err.message, 'Number of data items exceeded maximum');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });


        it('should create training data objects', () => {
            const training = dbobjects.createNumberTraining('testproject', [0.1, 200, -999.888], 'mylabel');
            assert(training.id);
            assert.equal(training.projectid, 'testproject');
            assert.deepEqual(training.numberdata, [0.1, 200, -999.888]);
            assert.equal(training.label, 'mylabel');
        });
    });


    describe('createImageTraining()', () => {
        it('should require project id', (done) => {
            try {
                dbobjects.createImageTraining('', 'myimageurl', 'label');
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });

        it('should not require an image label', () => {
            const training = dbobjects.createImageTraining('projectid', 'trainingurl', undefined);
            assert(training.id);
            assert.equal(training.projectid, 'projectid');
            assert.equal(training.imageurl, 'trainingurl');
        });

        it('should require an image url', (done) => {
            try {
                dbobjects.createImageTraining('projectid', undefined, undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });

        it('should require a storable image url', (done) => {
            try {
                dbobjects.createImageTraining('projectid', randomstring.generate({ length : 1500 }), 'label');
            }
            catch (err) {
                assert.equal(err.message, 'Image URL exceeds maximum allowed length (1024 characters)');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject training', '');
        });
    });


    describe('createBluemixCredentials', () => {

        it('should require a service type', (done) => {
            try {
                dbobjects.createBluemixCredentials(undefined, 'class', 'apikey', undefined, undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require a valid service type', (done) => {
            try {
                dbobjects.createBluemixCredentials('blah', 'class', 'apikey', undefined, undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Invalid service type');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require an API key for visual recognition credentials', (done) => {
            try {
                dbobjects.createBluemixCredentials('visrec', 'class', undefined, 'username', 'password');
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require a valid API key for visual recognition credentials', (done) => {
            try {
                dbobjects.createBluemixCredentials('visrec', 'class', 'too short', undefined, undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Invalid API key');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should create visual recognition credentials', () => {
            const creds = dbobjects.createBluemixCredentials('visrec', 'class',
                'JykrybuxnMtGI8qQncMHKGugNunl5Z7jWXxoRDSa', undefined, undefined);
            assert(creds.id);
            assert(creds.url);
            assert.equal(creds.servicetype, 'visrec');
            assert.equal(creds.username, 'JykrybuxnMtGI8qQncMH');
            assert.equal(creds.password, 'KGugNunl5Z7jWXxoRDSa');
        });

        it('should require a username for conversation credentials', (done) => {
            try {
                dbobjects.createBluemixCredentials('conv', 'class', undefined, undefined, 'password');
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require a password for conversation credentials', (done) => {
            try {
                dbobjects.createBluemixCredentials('conv', 'class', undefined, 'username', undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required attributes');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require a valid username for conversation credentials', (done) => {
            try {
                dbobjects.createBluemixCredentials('conv', 'class', undefined, 'username', 'password');
            }
            catch (err) {
                assert.equal(err.message, 'Invalid credentials');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require a valid password for conversation credentials', (done) => {
            try {
                dbobjects.createBluemixCredentials('conv', 'class', undefined,
                    'Mhtugfiuq6DNTMFRrwdMk2DUcvgAWj7W9jOL', 'password');
            }
            catch (err) {
                assert.equal(err.message, 'Invalid credentials');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should create conversation credentials', () => {
            const creds = dbobjects.createBluemixCredentials('conv', 'class',
                undefined, 'Mhtugfiuq6DNTMFRrwdMk2DUcvgAWj7W9jOL', 'THTBtUnNl5jT');
            assert(creds.id);
            assert(creds.url);
            assert.equal(creds.servicetype, 'conv');
            assert.equal(creds.username, 'Mhtugfiuq6DNTMFRrwdMk2DUcvgAWj7W9jOL');
            assert.equal(creds.password, 'THTBtUnNl5jT');
        });
    });



    describe('createClassTenant', () => {

        it('should require a class id', (done) => {
            try {
                dbobjects.createClassTenant(undefined);
            }
            catch (err) {
                assert.equal(err.message, 'Missing required class id');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require a long enough class id', (done) => {
            try {
                dbobjects.createClassTenant('x');
            }
            catch (err) {
                assert.equal(err.message, 'Not a valid class id');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require a short enough class id', (done) => {
            try {
                dbobjects.createClassTenant('abcdefghijklmnopqrstuvwxyzabcdefghijk');
            }
            catch (err) {
                assert.equal(err.message, 'Not a valid class id');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require lowercase class ids', (done) => {
            try {
                dbobjects.createClassTenant('HELLO');
            }
            catch (err) {
                assert.equal(err.message, 'Not a valid class id');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require only letters in class ids', (done) => {
            try {
                dbobjects.createClassTenant('hello world');
            }
            catch (err) {
                assert.equal(err.message, 'Not a valid class id');
                return done();
            }
            assert.fail(1, 0, 'Failed to reject request', '');
        });

        it('should require a valid class id', () => {
            const created = dbobjects.createClassTenant('testing');
            assert.deepStrictEqual(created, {
                id : 'testing',
                projecttypes : 'text,images,numbers',
                ismanaged : 0,
                maxusers : 15,
                maxprojectsperuser : 2,
                textclassifiersexpiry : 24,
                imageclassifiersexpiry : 24,
            });
        });
    });
});
