import Bull from 'bull';
import emailProcess from '../processes/email.process.js';
import {setQueues, BullAdapter} from 'bull-board';

const emailQueue = new Bull('email', {
  redis: {
    host: 'tutorial_redis', // Docker service name
    port: 6379
  }
});

setQueues([
    new BullAdapter(emailQueue)
]);

emailQueue.process(emailProcess);

const sendNewEmail = (data) => {
    emailQueue.add(data, {
        attempts: 5
    });
};

export {
    sendNewEmail
}