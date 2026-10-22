const receiptContactService = require("../services/receiptContactService");


// SEARCH RECEIPT CONTACTS
const searchReceiptContacts = async (req, res) => {

    try {

        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                message: "Search query is required"
            });
        }

        const contacts =
            await receiptContactService.searchReceiptContacts(
                query
            );

        return res.status(200).json({
            message: "Receipt contacts retrieved successfully",
            contacts
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Failed to search receipt contacts"
        });

    }
};


// SAVE RECEIPT CONTACT
const saveReceiptContact = async (req, res) => {

    try {

        const { type, value } = req.body;

        if (!type || !value) {
            return res.status(400).json({
                message: "Contact type and value are required"
            });
        }

        const contact =
            await receiptContactService.saveReceiptContact(
                type,
                value
            );

        return res.status(201).json({
            message: "Receipt contact saved successfully",
            contact
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Failed to save receipt contact"
        });

    }
};


module.exports = {
    searchReceiptContacts,
    saveReceiptContact
};