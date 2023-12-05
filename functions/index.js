
// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const {logger} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into
// Firestore under the path /messages/:documentId/original
exports.setMessageActive = onRequest(async (req, res) => {
    try {
        // TODO: CHeck SIGNING SECRET
        const event = req?.body;

        if (event?.type == "checkout.session.completed") {
            const writeResult = await getFirestore()
            .doc(`urls/${event?.data?.object?.client_reference_id}`).update({ active: true });

            res.json({failed: false, message: "It worked"});
        } else {
            res.json({failed: true, message: `Wrong event type: ${event?.type}`});
            return;
        }

    } catch(e) {
        res.json({failed: true, message: e});
        return;
    }
});