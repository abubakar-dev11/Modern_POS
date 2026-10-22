const formatReceipt = (receipt) => {

    return {

        receiptNumber:
            receipt.receiptNumber,

        date:
            receipt.date,

        business:
            receipt.business
                ? {

                    name:
                        receipt.business.name,

                    phone:
                        receipt.business.phone,

                    email:
                        receipt.business.email,

                    address:
                        receipt.business.address

                }
                : null,

        branch:
            receipt.branch
                ? {

                    name:
                        receipt.branch.name,

                    location:
                        receipt.branch.location,

                    phone:
                        receipt.branch.phone

                }
                : null,

        customer:
            receipt.customer
                ? {

                    name:
                        receipt.customer.name,

                    phone:
                        receipt.customer.phone,

                    email:
                        receipt.customer.email,

                    address:
                        receipt.customer.address

                }
                : null,

        /*
         * The name saved on the sale is the main
         * customer name displayed on the receipt.
         */
        customerName:
            receipt.customerName ||
            null,

        items:
            receipt.items.map(item => ({

                productName:
                    item.Product.name,

                quantity:
                    item.quantity,

                unitPrice:
                    item.unitPrice,

                totalPrice:
                    item.totalPrice

            })),

        subtotal:
            receipt.subtotal,

        discount:
            receipt.discount,

        totalAmount:
            receipt.totalAmount,

        totalPaid:
            receipt.totalPaid,

        balance:
            receipt.balance,

        paymentStatus:
            receipt.paymentStatus

    };

};


module.exports = {
    formatReceipt
};