const { ReceiptContact } = require("../models");


// SEARCH RECEIPT CONTACTS
const searchReceiptContacts = async (query) => {

    if (!query) {
        return [];
    }

    const contacts = await ReceiptContact.findAll({
        where: {
            value: {
                [require("sequelize").Op.like]: `${query}%`
            }
        },
        order: [
            ["lastUsedAt", "DESC"]
        ],
        limit: 10
    });

    return contacts;
};
// SAVE RECEIPT CONTACT
const saveReceiptContact = async (type, value) => {

    const [contact, created] = await ReceiptContact.findOrCreate({
        where: {
            value
        },
        defaults: {
            type,
            lastUsedAt: new Date()
        }
    });

    if (!created) {

        contact.type = type;
        contact.lastUsedAt = new Date();

        await contact.save();
    }

    return contact;
};

module.exports = {
    searchReceiptContacts,
    saveReceiptContact

};