/*eslint-env mocha */
import * as assert from 'assert';
import * as uuid from 'uuid/v1';

import * as Objects from '../../lib/db/db-types';
import * as store from '../../lib/db/store';


describe('DB store', () => {

    before(() => {
        return store.init();
    });
    after(() => {
        return store.disconnect();
    });

    const DEFAULT_PAGING: Objects.PagingOptions = {
        start : 0,
        limit : 50,
    };


    describe('storeTextTraining', () => {

        it('should store training data', async () => {
            const projectid = uuid();
            const text = uuid();
            const label = uuid();

            const training = await store.storeTextTraining(projectid, text, label);
            assert(training);
            assert.equal(training.projectid, projectid);
            assert.equal(training.textdata, text);
            assert.equal(training.label, label);

            return store.deleteTextTrainingByProjectId(projectid);
        });
    });



    describe('deleteTextTraining', () => {

        it('should delete training data', async () => {
            const projectid = uuid();
            const text = uuid();
            const label = uuid();

            const training = await store.storeTextTraining(projectid, text, label);
            assert(training);

            let retrieved = await store.getTextTraining(projectid, DEFAULT_PAGING);
            assert(retrieved);
            assert.equal(retrieved.length, 1);

            await store.deleteTextTrainingByProjectId(projectid);

            retrieved = await store.getTextTraining(projectid, DEFAULT_PAGING);
            assert(retrieved);
            assert.equal(retrieved.length, 0);
        });
    });



    describe('bulkStoreTextTraining', () => {

        it('should store multiple rows', async () => {
            const projectid = uuid();
            const data = [];

            let retrieved = await store.getTextTraining(projectid, DEFAULT_PAGING);
            assert.equal(retrieved.length, 0);

            for (let labelIdx = 0; labelIdx < 5; labelIdx++) {
                const label = uuid();

                for (let text = 0; text < 5; text++) {
                    const textdata = uuid();

                    data.push({ textdata, label });
                }
            }

            await store.bulkStoreTextTraining(projectid, data);

            retrieved = await store.getTextTraining(projectid, DEFAULT_PAGING);
            assert.equal(retrieved.length, 25);

            return store.deleteTextTrainingByProjectId(projectid);
        });

        it('should count training data', async () => {
            const projectid = uuid();
            let count = await store.countTextTraining(projectid);
            assert.equal(count, 0);

            const data = [];

            for (let labelIdx = 0; labelIdx < 6; labelIdx++) {
                const label = uuid();

                for (let text = 0; text < 7; text++) {
                    const textdata = uuid();

                    data.push({ textdata, label });
                }
            }

            await store.bulkStoreTextTraining(projectid, data);

            count = await store.countTextTraining(projectid);
            assert.equal(count, 42);

            return store.deleteTextTrainingByProjectId(projectid);
        });

        it('should count training data by label', async () => {
            const projectid = uuid();
            let counts = await store.countTextTrainingByLabel(projectid);
            assert.deepEqual(counts, {});

            const data = [];

            const expected = {};

            for (let labelIdx = 0; labelIdx < 5; labelIdx++) {
                const label = uuid();
                const num = 8 + labelIdx;

                for (let text = 0; text < num; text++) {
                    const textdata = uuid();

                    data.push({ textdata, label });
                }

                expected[label] = num;
            }

            await store.bulkStoreTextTraining(projectid, data);

            counts = await store.countTextTrainingByLabel(projectid);
            assert.deepEqual(counts, expected);

            return store.deleteTextTrainingByProjectId(projectid);
        });
    });


    describe('getTextTraining', () => {

        it('should retrieve training data', async () => {
            const projectid = uuid();
            const text = uuid();
            const label = uuid();

            const training = await store.storeTextTraining(projectid, text, label);
            assert(training);

            const retrieved = await store.getTextTraining(projectid, DEFAULT_PAGING);
            assert(retrieved);
            assert.equal(retrieved.length, 1);
            assert.equal(retrieved[0].id, training.id);
            assert.equal(retrieved[0].textdata, text);
            assert.equal(retrieved[0].label, label);

            return store.deleteTextTrainingByProjectId(projectid);
        });

        async function createTestData(projectid, numLabels, numText) {
            const testdata = [];
            const labels = [];

            for (let labelIdx = 0; labelIdx < numLabels; labelIdx++) {
                const label = uuid();
                labels.push(label);

                for (let text = 0; text < numText; text++) {
                    const textdata = uuid();

                    testdata.push({ textdata, label });
                }
            }

            await store.bulkStoreTextTraining(projectid, testdata);
            return labels;
        }


        it('should fetch specific amount of training data', async () => {
            const projectid = uuid();

            await createTestData(projectid, 6, 9);

            let retrieved = await store.getTextTraining(projectid, { start : 0, limit : 2 });
            assert.equal(retrieved.length, 2);

            retrieved = await store.getTextTraining(projectid, { start : 0, limit : 6 });
            assert.equal(retrieved.length, 6);

            retrieved = await store.getTextTraining(projectid, { start : 0, limit : 52 });
            assert.equal(retrieved.length, 52);

            retrieved = await store.getTextTraining(projectid, DEFAULT_PAGING);
            assert.equal(retrieved.length, 50);

            return store.deleteTextTrainingByProjectId(projectid);
        });


        it('should fetch labels from training data', async () => {
            const projectid = uuid();

            let labels = await createTestData(projectid, 6, 9);
            assert.equal(labels.length, 6);
            let retrieved = await store.getTrainingLabels(projectid);
            assert.deepEqual(retrieved.sort(), labels.sort());

            labels = await createTestData(projectid, 8, 5);
            assert.equal(labels.length, 8);
            retrieved = await store.getTrainingLabels(projectid);
            assert.equal(retrieved.length, 8 + 6);

            return store.deleteTextTrainingByProjectId(projectid);
        });


        it('should fetch training data from a specified offset', async () => {
            const projectid = uuid();
            const label = uuid();

            for (let idx = 0; idx < 10; idx++) {
                await store.storeTextTraining(projectid, idx.toString(), label);
            }

            for (let idx = 0; idx < 10; idx++) {
                const search = { start : idx, limit : 10 - idx };
                const retrieved = await store.getTextTraining(projectid, search);
                assert.equal(retrieved.length, 10 - idx);

                for (let verify = idx; verify < (10 - idx); verify++) {
                    const next = retrieved.shift();
                    assert.equal(next.label, label);
                    assert.equal(next.textdata, verify);
                }
            }

            return store.deleteTextTrainingByProjectId(projectid);
        }).timeout(5000);
    });


    describe('getTextTrainingByLabel', () => {

        it('should retrieve data by label', async () => {
            const projectid = uuid();
            const targetlabel = uuid();
            const data = [
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : targetlabel },
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : targetlabel },
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : targetlabel },
                { textdata : uuid(), label : uuid() },
            ];

            let retrieved = await store.getTextTrainingByLabel(projectid, targetlabel, DEFAULT_PAGING);
            assert.equal(retrieved.length, 0);

            await store.bulkStoreTextTraining(projectid, data);

            retrieved = await store.getTextTrainingByLabel(projectid, targetlabel, DEFAULT_PAGING);
            assert.equal(retrieved.length, 3);
            assert.deepEqual(retrieved.map((item) => item.textdata),
                             [ data[2].textdata, data[5].textdata, data[7].textdata ]);

            retrieved = await store.getTextTrainingByLabel(projectid, targetlabel, { start : 1, limit : 1 });
            assert.equal(retrieved.length, 1);
            assert.deepEqual(retrieved.map((item) => item.textdata),
                             [ data[5].textdata ]);

            return store.deleteTextTrainingByProjectId(projectid);
        });
    });


    describe('renameTextTrainingLabel', () => {

        it('should rename a label', async () => {
            const projectid = uuid();
            const BEFORE = uuid();
            const AFTER = uuid();

            const data = [
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : BEFORE },
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : BEFORE },
                { textdata : uuid(), label : uuid() },
                { textdata : uuid(), label : BEFORE },
                { textdata : uuid(), label : uuid() },
            ];
            await store.bulkStoreTextTraining(projectid, data);

            const fetched = await store.getTextTraining(projectid, DEFAULT_PAGING);
            const expected = fetched.map((item) => {
                if (item.label === BEFORE) {
                    return { id: item.id, textdata : item.textdata, label : AFTER };
                }
                return item;
            });

            await store.renameTextTrainingLabel(projectid, BEFORE, AFTER);

            const retrieved = await store.getTextTraining(projectid, DEFAULT_PAGING);
            assert.deepEqual(retrieved, expected);

            const counts = await store.countTextTrainingByLabel(projectid);
            assert.equal(counts[AFTER], 3);
            assert.equal(BEFORE in counts, false);
        });

    });

});