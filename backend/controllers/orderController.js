import orderModel from "../models/orderModel.js";
import userModel from '../models/userModel.js';
import Stripe from "stripe";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer'; // <-- NEW: Import Nodemailer directly here

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const frontend_url = process.env.FRONTEND_URL || "http://31.97.180.184:5174";

// --- NEW: Nodemailer Transporter Setup (moved from emailSender.js) ---
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com", // e.g., "smtp.gmail.com" for Gmail
    port: process.env.EMAIL_PORT || 587, // Standard secure SMTP port
    secure: false, // true for 465, false for other ports like 587
    auth: {
        user: "hassan.rahmani922@gmail.com", // Your email address from .env
        pass: "slgy jlio tqej weke"  // Your email password (or App Password for Gmail) from .env
    },
    // Optional: for self-signed certificates, or if your SMTP server has issues with certs
    // tls: {
    //     rejectUnauthorized: false
    // }
});
// --- END Nodemailer Transporter Setup ---

// --- NEW: sendOrderConfirmationEmail function (moved from emailSender.js) ---
const sendOrderConfirmationEmail = async (toEmail, orderId, orderDetails) => {
    try {
        console.log("Email Send to: ")
        console.log(toEmail)
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: toEmail,                  // Recipient email (passed as argument)
            subject: `Bestellbestätigung #${orderId} - Mourya Fabricators`, // Betreffzeile
            html: `
                <h2>Ihre Bestellung bei Mourya Fabricators ist bestätigt!</h2>
                <p>Vielen Dank für Ihre Bestellung. Hier sind die Details:</p>
                <p><strong>Bestell-ID:</strong> #${orderId}</p>
                <h3>Bestellte Artikel:</h3>
                <table style="width:100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color:#f2f2f2;">
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Artikel</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Menge</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Preis</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderDetails.items.map(item => `
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd;">${item.name} ${item.options && item.options.length > 0 ? '(' + item.options.join(', ') + ')' : ''}</td>
                                <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">€${(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Lieferkosten:</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">€${orderDetails.deliveryFee.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Gesamt:</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">€${orderDetails.amount.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                <h3>Lieferadresse:</h3>
                <p>
                    ${orderDetails.address.firstName} ${orderDetails.address.lastName}<br>
                    ${orderDetails.address.street} ${orderDetails.address.houseNumber}<br>
                    ${orderDetails.address.zipcode} ${orderDetails.address.city}<br>
                    ${orderDetails.address.state ? orderDetails.address.state + '<br>' : ''}
                    ${orderDetails.address.phone}<br>
                </p>
                ${orderDetails.address.note ? `<p><strong>Hinweis:</strong> ${orderDetails.address.note}</p>` : ''}
                <p>Wir werden Sie über den Status Ihrer Bestellung auf dem Laufenden halten.</p>
                <p>Mit freundlichen Grüßen,<br>Ihr Mourya Fabricators Team</p>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return true; // Indicate success
    } catch (error) {
        console.error('Error sending email:', error);
        return false; // Indicate failure
    }
};
// --- END sendOrderConfirmationEmail function ---


const placeOrder = async (req, res) => {
    console.log("Received Place Order Request Body:", req.body);
    console.log("User ID from Request (expected from middleware):", req.userId);

    try {
        const userId = req.userId || req.body.userId;
        
        if (!userId) {
            console.error("Error: userId is missing from request. Neither middleware nor body provided it.");
            return res.status(401).json({ success: false, message: "Non autorisé, userId manquant." });
        }

        const { items, amount, address, deliveryFee } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            console.error("Validation Error: Items array is missing, empty, or not an array.");
            return res.status(400).json({ success: false, message: "Les articles du panier sont manquants ou invalides." });
        }

        const formattedItems = items.map((item) => {
            if (!item._id || !item.name || item.price === undefined || !item.quantity) {
                console.error("Validation Error: Missing essential item property for item:", item);
                throw new Error("Propriétés d'article essentielles manquantes (ID, nom, prix ou quantité) pour un ou plusieurs articles.");
            }

            const objectId = new mongoose.Types.ObjectId(item._id);

            const optionsKey = item.options && Array.isArray(item.options) ? item.options.sort().join(",") : "";
            const uniqueKey = `${item._id}-${optionsKey}`;

            return {
                uniqueKey,
                itemId: objectId,
                options: item.options || [],
                quantity: item.quantity,
                requiredSelections: item.requiredSelections || {},
                name: item.name,
                price: item.price
            };
        });

        const newOrder = new orderModel({
            userId,
            items: formattedItems,
            amount,
            address,
        });

        await newOrder.save();
        console.log("Order saved to database with ID:", newOrder._id);

        // --- Email Sending Logic (placed after order is saved) ---
        // WARNING: This sends email BEFORE payment is confirmed.
        // It's generally safer to send confirmation emails in verifyOrder after payment success.
        try {
            const user = await userModel.findById(userId);
            if (user && user.email) {
                const orderDetailsForEmail = {
                    items: formattedItems,
                    amount: amount,
                    deliveryFee: typeof deliveryFee === 'number' ? deliveryFee : (amount - formattedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)),
                    address: address
                };
                const emailSent = await sendOrderConfirmationEmail(user.email, newOrder._id.toString(), orderDetailsForEmail);
                if (emailSent) {
                    console.log(`Initial order email sent to ${user.email} for order ${newOrder._id}`);
                } else {
                    console.error(`Failed to send initial order email for order ${newOrder._id}`);
                }
            } else {
                console.error(`User or user email not found for userId ${userId}. Cannot send initial order email.`);
            }
        } catch (emailError) {
            console.error("Error during initial email sending attempt:", emailError);
        }
        // --- END Email Sending Logic ---

        await userModel.findByIdAndUpdate(userId, { cartData: {} });
        console.log(`Cart cleared for user ${userId}`);

        const line_items = [];

        req.body.items.forEach((item) => {
            if (!item.name || item.price === undefined || !item.quantity) {
                console.error("Stripe Line Item Error: Missing name, price, or quantity for item.", item);
                throw new Error("Données d'article invalides pour le paiement Stripe.");
            }

            let fullItemName = item.name;
            if (item.options && item.options.length > 0) {
                fullItemName += ` (${item.options.join(", ")})`;
            }
            if (item.requiredSelections && Object.keys(item.requiredSelections).length > 0) {
                const selections = Object.entries(item.requiredSelections)
                                       .map(([key, value]) => `${key}: ${value}`)
                                       .join(", ");
                fullItemName += ` [${selections}]`;
            }

            line_items.push({
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: fullItemName
                    },
                    unit_amount: Math.round(item.price * 100)
                },
                quantity: item.quantity
            });
        });

        const finalDeliveryFeeAmount = typeof deliveryFee === 'number' && deliveryFee >= 0 ? deliveryFee : 0;

        if (finalDeliveryFeeAmount > 0) {
            line_items.push({
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: "Frais de livraison"
                    },
                    unit_amount: Math.round(finalDeliveryFeeAmount * 100)
                },
                quantity: 1
            });
        }

        console.log("Stripe Line Items:", JSON.stringify(line_items, null, 2));

        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            mode: 'payment',
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
        });

        console.log("Stripe Session created:", session.url);
        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.error("Full Error during placeOrder:", error);

        let errorMessage = "Une erreur inattendue est survenue lors du traitement de votre commande. Veuillez réessayer.";

        if (error.name === 'ValidationError') {
            errorMessage = `Erreur de validation de la commande: ${error._message}. Détails: ${Object.values(error.errors).map(e => e.message).join(', ')}.`;
        } else if (error.message.includes("Missing essential item properties") || error.message.includes("Invalid item data for Stripe checkout")) {
            errorMessage = "Erreur avec les données des articles dans votre panier. Veuillez vérifier votre panier et réessayer.";
        } else if (error.message.includes("ObjectId")) {
            errorMessage = "Un ou plusieurs identifiants d'article sont invalides. Veuillez réessayer.";
        } else if (error.type && error.type.startsWith('Stripe')) {
             errorMessage = `Erreur de paiement Stripe: ${error.message}.`;
        }

        res.status(500).json({ success: false, message: errorMessage });
    }
};

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === true) {
            // No email sending here, as it's now handled in placeOrder.
            // If you later decide to send email only AFTER payment confirmation,
            // this is the recommended place to re-enable the email sending logic.
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Paiement réussi." });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Paiement échoué." });
        }
    } catch (error) {
        console.error("Error during verifyOrder:", error);
        res.status(500).json({ success: false, message: "Erreur lors de la vérification de la commande." });
    }
};

const userOrders = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Non autorisé, connexion requise." });
        }
        const orders = await orderModel.find({ userId: userId });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "Erreur lors de la récupération des commandes de l'utilisateur." });
    }
}

const listOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
    } catch (error) {
        console.error("Error listing orders for admin:", error);
        res.status(500).json({success:false,message:"Erreur lors de la récupération de toutes les commandes."})
    }
}

const updateStatus = async (req,res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
        res.json({success:true,message:"Statut mis à jour avec succès."})
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({success:false,message:"Erreur lors de la mise à jour du statut."})
    }
}

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };