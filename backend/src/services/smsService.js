const sendSMS = async (phone, message) => {
    try {

        const formattedPhone = phone.startsWith("0")
            ? "234" + phone.slice(1)
            : phone;

        const response = await fetch(
            `${process.env.TERMII_BASE_URL}api/sms/send`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    api_key: process.env.TERMII_API_KEY,
                    to: formattedPhone,
                    from: "Modern POS",
                    sms: message,
                    type: "plain",
                    channel: "generic"
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Termii SMS error:", data);
            throw new Error("Failed to send SMS");
        }

        console.log("SMS sent successfully:", data);

        return data;

    } catch (error) {
        console.error("SMS service error:", error);
        throw error;
    }
};

module.exports = {
    sendSMS
};