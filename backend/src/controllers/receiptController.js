
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
            : parsedDate.toLocaleString("en-NG")
    );

    const items = Array.isArray(formattedReceipt.items)
        ? formattedReceipt.items
        : [];

    const itemsHtml = items.map((item) => {
        const productName = escapeHtml(
            item.productName || "Unknown Product"
        );

        const quantity = Number(item.quantity ?? 0);

        return `
            <tr>
                <td style="padding:10px 6px;border-bottom:1px solid #eee;">
                    ${productName}
                </td>
                <td style="padding:10px 6px;text-align:center;border-bottom:1px solid #eee;">
                    ${Number.isFinite(quantity) ? quantity : 0}
                </td>
                <td style="padding:10px 6px;text-align:right;border-bottom:1px solid #eee;">
                    ${money(item.unitPrice)}
                </td>
                <td style="padding:10px 6px;text-align:right;border-bottom:1px solid #eee;">
                    ${money(item.totalPrice)}
                </td>
            </tr>
        `;
    }).join("");

    const paymentStatus = escapeHtml(
        receipt.paymentStatus || "UNKNOWN"
    );

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Receipt - ${receiptNumber}</title>
</head>
<body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="max-width:760px;width:100%;box-sizing:border-box;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">

        <div style="padding:24px;text-align:center;border-bottom:1px solid #e5e7eb;">
            <h1 style="margin:0;font-size:24px;">${businessName}</h1>
            <p style="margin:6px 0 0;color:#6b7280;font-size:14px;">Sales Receipt</p>
        </div>

        <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Sale Number</td>
                    <td style="padding:6px 0;text-align:right;font-weight:bold;">${receiptNumber}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Customer</td>
                    <td style="padding:6px 0;text-align:right;">${customerName}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Email</td>
                    <td style="padding:6px 0;text-align:right;">${customerEmail}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Phone</td>
                    <td style="padding:6px 0;text-align:right;">${customerPhone}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Branch</td>
                    <td style="padding:6px 0;text-align:right;">${branchName}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Date</td>
                    <td style="padding:6px 0;text-align:right;">${receiptDate}</td>
                </tr>
            </table>
        </div>

        <div style="padding:20px 24px;">
            <h2 style="margin:0 0 14px;font-size:18px;">Sale Items</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
                <thead>
                    <tr>
                        <th style="padding:10px 6px;text-align:left;border-bottom:1px solid #e5e7eb;color:#6b7280;">Product</th>
                        <th style="padding:10px 6px;text-align:center;border-bottom:1px solid #e5e7eb;color:#6b7280;">Qty</th>
                        <th style="padding:10px 6px;text-align:right;border-bottom:1px solid #e5e7eb;color:#6b7280;">Unit Price</th>
                        <th style="padding:10px 6px;text-align:right;border-bottom:1px solid #e5e7eb;color:#6b7280;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>

        <div style="padding:20px 24px;border-top:1px solid #e5e7eb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Subtotal</td>
                    <td style="padding:6px 0;text-align:right;">${money(receipt.subtotal)}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Discount</td>
                    <td style="padding:6px 0;text-align:right;">${money(receipt.discount)}</td>
                </tr>
                <tr>
                    <td style="padding:12px 0 6px;font-size:17px;font-weight:bold;">Total</td>
                    <td style="padding:12px 0 6px;text-align:right;font-size:17px;font-weight:bold;">${money(receipt.totalAmount)}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Paid</td>
                    <td style="padding:6px 0;text-align:right;">${money(receipt.totalPaid)}</td>
                </tr>
                <tr>
                    <td style="padding:6px 0;color:#6b7280;">Balance Due</td>
                    <td style="padding:6px 0;text-align:right;font-weight:bold;">${money(receipt.balance)}</td>
                </tr>
            </table>

            <div style="margin-top:18px;padding:12px;text-align:center;border-radius:6px;background:#f3f4f6;font-weight:bold;">
                Payment Status: ${paymentStatus}
            </div>
        </div>

        <div style="padding:22px;text-align:center;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;">
            <p style="margin:0;font-weight:bold;color:#111827;">Thank you for your purchase!</p>
            <p style="margin:7px 0 0;">Thank you for shopping with us.</p>
        </div>
    </div>
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
