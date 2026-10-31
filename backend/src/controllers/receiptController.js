
const { sendEmail } = require("../services/emailService");
const { sendWhatsApp } = require("../services/whatsappService");
const { sendSMS } = require("../services/smsService");
const receiptService = require("../services/receiptService");
const { formatReceipt } = require("../utils/receiptFormatter");


/* =========================================
   AUTHENTICATED BUSINESS
========================================= */

const getBusinessId = (req) => {
    const businessId = Number(req.user?.businessId);

    if (!Number.isInteger(businessId) || businessId <= 0) {
        const error = new Error("Valid business account is required");
        error.statusCode = 403;
        throw error;
    }

    return businessId;
};


/* =========================================
   HTML HELPERS
========================================= */

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};


const money = (value) => {
    const amount = Number(value ?? 0);

    return `₦${(Number.isFinite(amount) ? amount : 0)
        .toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
};



const buildReceiptHtml = (receipt, formattedReceipt, saleNumber) => {
    const businessName = escapeHtml(
        receipt.business?.name || "MODERN POS"
    );

    const businessAddress = escapeHtml(
        receipt.business?.address || ""
    );

    const businessPhone = escapeHtml(
        receipt.business?.phone || ""
    );
    const businessLogo = receipt.businessLogo;

    const safeBusinessLogo =
        typeof businessLogo === "string" &&
        /^https:\/\/res\.cloudinary\.com\//i.test(businessLogo)
            ? escapeHtml(businessLogo)
            : "";

    const receiptNumber = escapeHtml(
        receipt.receiptNumber || saleNumber
    );

    const customerName = escapeHtml(
        receipt.customerName ||
        receipt.customer?.name ||
        "Walk-in Customer"
    );

    const customerEmail = escapeHtml(
        receipt.customer?.email || "-"
    );

    const customerPhone = escapeHtml(
        receipt.customer?.phone || "-"
    );

    const branchName = escapeHtml(
        receipt.branch?.name || "-"
    );

    const parsedDate = new Date(receipt.date);

    const receiptDate = escapeHtml(
        Number.isNaN(parsedDate.getTime())
            ? "-"
            : parsedDate.toLocaleString("en-NG", {
                dateStyle: "medium",
                timeStyle: "short"
            })
    );

    const items = Array.isArray(formattedReceipt?.items)
        ? formattedReceipt.items
        : [];

    const itemsHtml = items.length
        ? items.map((item) => {
            const productName = escapeHtml(
                item.productName || "Unknown Product"
            );

            const quantity = Number(item.quantity ?? 0);

            return `
                <tr>
                    <td style="padding:13px 10px;border-bottom:1px solid #e5e7eb;color:#1f2937;font-size:13px;">
                        ${productName}
                    </td>

                    <td style="padding:13px 10px;text-align:center;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">
                        ${Number.isFinite(quantity) ? quantity : 0}
                    </td>

                    <td style="padding:13px 10px;text-align:right;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;white-space:nowrap;">
                        ${money(item.unitPrice)}
                    </td>

                    <td style="padding:13px 10px;text-align:right;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600;white-space:nowrap;">
                        ${money(item.totalPrice)}
                    </td>
                </tr>
            `;
        }).join("")
        : `
            <tr>
                <td colspan="4" style="padding:20px;text-align:center;color:#6b7280;font-size:13px;">
                    No items found for this receipt.
                </td>
            </tr>
        `;

    const paymentStatus = escapeHtml(
        receipt.paymentStatus || "UNKNOWN"
    );

    const statusColor =
        String(receipt.paymentStatus || "").toUpperCase() === "PAID"
            ? "#15803d"
            : "#b45309";

    const statusBackground =
        String(receipt.paymentStatus || "").toUpperCase() === "PAID"
            ? "#dcfce7"
            : "#fef3c7";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${receiptNumber}</title>
</head>

<body style="margin:0;padding:24px 10px;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="max-width:680px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

                    <!-- HEADER -->
                    <tr>
                        <td align="center" style="padding:32px 24px;background:#14532d;color:#ffffff;">

                            <div style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#bbf7d0;">
                                SALES RECEIPT
                            </div>

                            <h1 style="margin:12px 0 8px;font-size:26px;line-height:1.3;color:#ffffff;">
                                ${businessName}
                            </h1>

                            ${businessAddress ? `
                                <p style="margin:5px 0;color:#dcfce7;font-size:12px;line-height:1.6;">
                                    ${businessAddress}
                                </p>
                            ` : ""}

                            ${businessPhone ? `
                                <p style="margin:5px 0;color:#dcfce7;font-size:12px;">
                                    Phone: ${businessPhone}
                                </p>
                            ` : ""}
                            ${safeBusinessLogo ? `
                                <img
                                    src="${safeBusinessLogo}"
                                    alt="${businessName} Logo"
                                    style="display:block;width:auto;max-width:150px;max-height:90px;object-fit:contain;margin:0 auto 16px;"
                                >
                            ` : ""}

                        </td>
                    </tr>

                    <!-- RECEIPT NUMBER -->
                    <tr>
                        <td style="padding:24px 26px 12px;">

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">
                                            Receipt Number
                                        </div>

                                        <div style="margin-top:6px;font-size:19px;font-weight:bold;color:#14532d;">
                                            ${receiptNumber}
                                        </div>
                                    </td>

                                    <td align="right" valign="top">
                                        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;">
                                            Payment Status
                                        </div>

                                        <span style="display:inline-block;margin-top:7px;padding:7px 13px;border-radius:20px;background:${statusBackground};color:${statusColor};font-size:11px;font-weight:bold;">
                                            ${paymentStatus}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- CUSTOMER DETAILS -->
                    <tr>
                        <td style="padding:12px 26px 24px;">

                            <div style="padding:17px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">

                                <h2 style="margin:0 0 13px;font-size:14px;color:#111827;">
                                    Customer Information
                                </h2>

                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                                    style="font-size:12px;">

                                    <tr>
                                        <td style="padding:6px 0;color:#6b7280;width:35%;">
                                            Customer
                                        </td>
                                        <td style="padding:6px 0;text-align:right;color:#111827;font-weight:600;">
                                            ${customerName}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:6px 0;color:#6b7280;">
                                            Email
                                        </td>
                                        <td style="padding:6px 0;text-align:right;color:#374151;word-break:break-word;">
                                            ${customerEmail}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:6px 0;color:#6b7280;">
                                            Phone
                                        </td>
                                        <td style="padding:6px 0;text-align:right;color:#374151;">
                                            ${customerPhone}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:6px 0;color:#6b7280;">
                                            Branch
                                        </td>
                                        <td style="padding:6px 0;text-align:right;color:#374151;">
                                            ${branchName}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td style="padding:6px 0;color:#6b7280;">
                                            Date
                                        </td>
                                        <td style="padding:6px 0;text-align:right;color:#374151;">
                                            ${receiptDate}
                                        </td>
                                    </tr>

                                </table>
                            </div>

                        </td>
                    </tr>

                    <!-- ITEMS -->
                    <tr>
                        <td style="padding:0 26px 24px;">

                            <h2 style="margin:0 0 14px;font-size:16px;color:#111827;">
                                Order Summary
                            </h2>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="border-collapse:collapse;">

                                <thead>
                                    <tr style="background:#f3f4f6;">
                                        <th align="left" style="padding:12px 10px;color:#6b7280;font-size:11px;text-transform:uppercase;">
                                            Product
                                        </th>

                                        <th align="center" style="padding:12px 10px;color:#6b7280;font-size:11px;text-transform:uppercase;">
                                            Qty
                                        </th>

                                        <th align="right" style="padding:12px 10px;color:#6b7280;font-size:11px;text-transform:uppercase;">
                                            Price
                                        </th>

                                        <th align="right" style="padding:12px 10px;color:#6b7280;font-size:11px;text-transform:uppercase;">
                                            Total
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${itemsHtml}
                                </tbody>

                            </table>

                        </td>
                    </tr>

                    <!-- PAYMENT SUMMARY -->
                    <tr>
                        <td style="padding:22px 26px;background:#f9fafb;border-top:1px solid #e5e7eb;">

                            <h2 style="margin:0 0 15px;font-size:15px;color:#111827;">
                                Payment Summary
                            </h2>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                                style="font-size:13px;">

                                <tr>
                                    <td style="padding:7px 0;color:#6b7280;">
                                        Subtotal
                                    </td>
                                    <td align="right" style="padding:7px 0;color:#374151;">
                                        ${money(receipt.subtotal)}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:7px 0;color:#6b7280;">
                                        Discount
                                    </td>
                                    <td align="right" style="padding:7px 0;color:#374151;">
                                        ${money(receipt.discount)}
                                    </td>
                                </tr>

                                <tr>
                                    <td colspan="2" style="padding:10px 0;">
                                        <div style="border-top:1px solid #d1d5db;"></div>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:5px 0;font-size:16px;font-weight:bold;color:#111827;">
                                        Total Amount
                                    </td>
                                    <td align="right" style="padding:5px 0;font-size:18px;font-weight:bold;color:#14532d;">
                                        ${money(receipt.totalAmount)}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:10px 0 5px;color:#6b7280;">
                                        Amount Paid
                                    </td>
                                    <td align="right" style="padding:10px 0 5px;color:#15803d;font-weight:600;">
                                        ${money(receipt.totalPaid)}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding:5px 0;color:#6b7280;">
                                        Balance Due
                                    </td>
                                    <td align="right" style="padding:5px 0;color:#b45309;font-weight:bold;">
                                        ${money(receipt.balance)}
                                    </td>
                                </tr>

                            </table>

                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td align="center" style="padding:28px 24px;background:#ffffff;">

                            <h2 style="margin:0 0 8px;font-size:17px;color:#14532d;">
                                Thank You!
                            </h2>

                            <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.7;">
                                Thank you for choosing ${businessName}.
                                We appreciate your business.
                            </p>

                            <div style="margin-top:20px;padding-top:15px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:10px;">
                                This is a computer-generated receipt.
                                Please keep it for your records.
                            </div>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
`;
};

/* =========================================
   GET RECEIPT
========================================= */

const getReceipt = async (req, res) => {
    try {
        const businessId = getBusinessId(req);
        const { saleNumber } = req.params;

        if (!saleNumber || !saleNumber.trim()) {
            return res.status(400).json({
                message: "Sale number is required"
            });
        }

        const receipt = await receiptService.getReceipt(
            saleNumber.trim(),
            businessId
        );

        const formattedReceipt = formatReceipt(receipt);

        return res.status(200).json({
            message: "Receipt retrieved successfully",
            receipt: formattedReceipt
        });

    } catch (error) {
        console.error("Get receipt error:", error.message);

        if (error.message === "Sale not found") {
            return res.status(404).json({
                message: "Sale not found"
            });
        }

        if (error.statusCode === 403) {
            return res.status(403).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to get receipt"
        });
    }
};


/* =========================================
   SEND RECEIPT

   IMPORTANT:
   Sending a receipt must NOT change Sale.status.
========================================= */

const sendReceipt = async (req, res) => {
    try {
        const businessId = getBusinessId(req);

        const {
            saleNumber,
            method,
            email,
            phone
        } = req.body;

        if (
            typeof saleNumber !== "string" ||
            !saleNumber.trim() ||
            !method
        ) {
            return res.status(400).json({
                message: "Sale number and method are required"
            });
        }

        const normalizedMethod = String(method)
            .trim()
            .toUpperCase();

        if (!["EMAIL", "WHATSAPP", "SMS"].includes(normalizedMethod)) {
            return res.status(400).json({
                message: `${normalizedMethod} receipt sending is not implemented yet`
            });
        }

        const receipt = await receiptService.getReceipt(
            saleNumber.trim(),
            businessId
        );

        const formattedReceipt = formatReceipt(receipt);

        const receiptText = JSON.stringify(
            formattedReceipt,
            null,
            2
        );

        const receiptHtml = buildReceiptHtml(
            receipt,
            formattedReceipt,
            saleNumber.trim()
        );

        /* =====================================
           EMAIL
        ===================================== */

        if (normalizedMethod === "EMAIL") {
            const recipientEmail = String(
                email || receipt.customer?.email || ""
            ).trim();

            if (!recipientEmail) {
                return res.status(400).json({
                    message: "Customer email is required"
                });
            }

            const validEmail =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);

            if (!validEmail) {
                return res.status(400).json({
                    message: "Please provide a valid email address"
                });
            }

            await sendEmail(
                recipientEmail,
                `Receipt - ${receipt.receiptNumber}`,
                receiptText,
                receiptHtml
            );

            // Sending a receipt does not change the sale or payment status.

            return res.status(200).json({
                message: "Receipt email sent successfully",
                saleNumber: receipt.receiptNumber,
                method: "EMAIL",
                email: recipientEmail,
                paymentStatus: receipt.paymentStatus,
                balance: receipt.balance
            });
        }

        /* =====================================
           WHATSAPP
        ===================================== */

        if (normalizedMethod === "WHATSAPP") {
            const recipientPhone = String(
                phone || receipt.customer?.phone || ""
            ).trim();

            if (!recipientPhone) {
                return res.status(400).json({
                    message: "Customer WhatsApp number is required"
                });
            }

            await sendWhatsApp(
                recipientPhone,
                receiptText
            );

            return res.status(200).json({
                message: "WhatsApp receipt processed successfully",
                saleNumber: receipt.receiptNumber,
                method: "WHATSAPP",
                phone: recipientPhone,
                paymentStatus: receipt.paymentStatus,
                balance: receipt.balance
            });
        }

        /* =====================================
           SMS
        ===================================== */

        if (normalizedMethod === "SMS") {
            const recipientPhone = String(
                phone || receipt.customer?.phone || ""
            ).trim();

            if (!recipientPhone) {
                return res.status(400).json({
                    message: "Customer phone number is required"
                });
            }

            await sendSMS(
                recipientPhone,
                receiptText
            );

            return res.status(200).json({
                message: "SMS receipt processed successfully",
                saleNumber: receipt.receiptNumber,
                method: "SMS",
                phone: recipientPhone,
                paymentStatus: receipt.paymentStatus,
                balance: receipt.balance
            });
        }

    } catch (error) {
        console.error("Send receipt error:", error.message);

        if (error.message === "Sale not found") {
            return res.status(404).json({
                message: "Sale not found"
            });
        }

        if (error.statusCode === 403) {
            return res.status(403).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to send receipt",
            error: process.env.NODE_ENV === "development"
                ? error.message
                : undefined
        });
    }
};


/* =========================================
   RECEIPT QUEUE
========================================= */

const getReceiptQueue = async (req, res) => {
    try {
        const businessId = getBusinessId(req);

        const receipts = await receiptService.getReceiptQueue(
            businessId
        );

        return res.status(200).json({
            message: "Receipt queue retrieved successfully",
            receipts
        });

    } catch (error) {
        console.error("Receipt queue error:", error.message);

        if (error.statusCode === 403) {
            return res.status(403).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to fetch receipt queue"
        });
    }
};


/* =========================================
   EXPORTS
========================================= */

module.exports = {
    getReceipt,
    getReceiptQueue,
    sendReceipt
};
