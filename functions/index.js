const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true });

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().mailer.user,
    pass: functions.config().mailer.pass
  }
});

exports.sendMail = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { from, to, subject, message } = req.query;

    const mailOptions = {
      from,
      to,
      subject,
      html: `<p style="font-size: 22px;">${message}</p>`
    };

    return transporter.sendMail(mailOptions, (erro, info) => {
      if (erro) {
        return res.status(500).send({
          success: false,
          error: erro.toString()
        });
      }
      return res.send({
        success: true,
        error: null
      });
    });
  });
});

const isDelete = change => change.before.exists && !change.after.exists;
const isCreate = change => !change.before.exists && change.after.exists;

const createAggregator = ({ documentPath, countsDocPath }) => {
  return functions.firestore
    .document(documentPath)
    .onWrite((change, context) => {
      console.log(
        `Aggregator for ${documentPath}`,
        change,
        `isDelete: ${isDelete(change)}`,
        `isCreate: ${isCreate(change)}`
      );
      if (!(isDelete(change) || isCreate(change))) return null;
      const eventsCountRef = db.collection("/counts").doc(countsDocPath);
      return db.runTransaction(function(t) {
        return t.get(eventsCountRef).then(doc => {
          const { count } = doc.data();
          if (isDelete(change)) {
            t.update(eventsCountRef, {
              count: count - 1
            });
          } else if (isCreate(change)) {
            t.update(eventsCountRef, {
              count: count + 1
            });
          }
        });
      });
    });
};

const createComplexAggregator = ({ documentPath, updateCount }) => {
  return functions.firestore
    .document(documentPath)
    .onWrite((change, context) => {
      console.log(
        `Aggregator for ${documentPath}`,
        change,
        `isDelete: ${isDelete(change)}`,
        `isCreate: ${isCreate(change)}`
      );
      if (isDelete(change)) {
        return updateCount({
          type: "delete",
          change,
          context
        });
      } else if (isCreate(change)) {
        return updateCount({
          type: "create",
          change,
          context
        });
      } else {
        return null;
      }
    });
};

const signupCountUpdater = ({ type, change, context }) => {
  let stack,
    category = null;
  if (type === "delete") {
    const document = change.before.data();
    stack = document.stack;
    category = document.category;
  } else if (type === "create") {
    const document = change.after.data();
    stack = document.stack;
    category = document.category;
  }
  const totalCountsRef = db.collection("/counts").doc("signups");
  const countsRef = db.collection(`/counts/signups/${stack}`).doc(`counts`);
  return db.runTransaction(async t => {
    const totalCountsDoc = await t.get(totalCountsRef);
    const countsDoc = await t.get(countsRef);
    const { count: totalCount } = totalCountsDoc.data();
    const count = countsDoc.data()[`${category}Count`];
    if (type === "create") {
      t.update(totalCountsRef, {
        count: totalCount + 1
      });
      t.update(countsRef, {
        [`${category}Count`]: count + 1
      });
    } else if (type === "delete") {
      t.update(totalCountsRef, {
        count: totalCount - 1
      });
      t.update(countsRef, {
        [`${category}Count`]: count - 1
      });
    }
  });
};

exports.aggregateEvents = createAggregator({
  documentPath: "/events/{eventID}",
  countsDocPath: "events"
});

exports.aggregateMaterials = createAggregator({
  documentPath: "/materials/{materialID}",
  countsDocPath: "materials"
});

exports.aggregateProjects = createAggregator({
  documentPath: "/projects/{projectID}",
  countsDocPath: "projects"
});

exports.aggregateInstructors = createAggregator({
  documentPath: "/instructors/{instructorID}",
  countsDocPath: "instructors"
});

exports.aggregateSignups = createComplexAggregator({
  documentPath: "/signups/{signupID}",
  updateCount: signupCountUpdater
});
