const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter using environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send order confirmation email
  async sendOrderConfirmation(customerEmail, customerName, orderDetails) {
    try {
      const { orderId, carName, totalPrice, customizations, orderDate } = orderDetails;

      // Build customizations list
      let customizationsList = '';
      if (customizations && customizations.length > 0) {
        customizationsList = customizations.map(item =>
          `<li><strong>${item.category}:</strong> ${item.name} - $${item.price.toLocaleString()}</li>`
        ).join('');
      }

      const mailOptions = {
        from: `"MARQUE DESIGN" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        replyTo: process.env.EMAIL_USER,
        subject: `Order Confirmation - ${orderId}`,
        text: `
MARQUE DESIGN - Luxury Car Customization

Thank You for Your Order!

Dear ${customerName},

We're excited to confirm your order. Your dream car is being prepared with the utmost care and attention to detail.

Order Details:
- Order ID: ${orderId}
- Order Date: ${new Date(orderDate).toLocaleDateString()}
- Car Model: ${carName}
${customizations && customizations.length > 0 ? `\nCustomizations:\n${customizations.map(item => `- ${item.category}: ${item.name} - $${item.price.toLocaleString()}`).join('\n')}` : ''}

Total: $${totalPrice.toLocaleString()}

Delivery Options:
Our team will contact you within 24-48 hours to discuss delivery options:
- White Glove Delivery
- Showroom Pickup
- Concierge Service

What's Next?
1. Our customization team will begin working on your vehicle
2. You'll receive progress updates via email
3. A delivery specialist will contact you to arrange delivery
4. Final inspection and handover of your dream car

If you have any questions, please don't hesitate to contact us.

Best regards,
The MARQUE DESIGN Team
        `,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a1a1a, #2d2d2d); color: #d4af37; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f9f9f9; padding: 30px; }
              .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .total { font-size: 24px; color: #d4af37; font-weight: bold; text-align: center; padding: 20px; background: #1a1a1a; color: #d4af37; border-radius: 8px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              ul { list-style: none; padding: 0; }
              li { padding: 8px 0; border-bottom: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>MARQUE DESIGN</h1>
                <p>Luxury Car Customization</p>
              </div>
              <div class="content">
                <h2>Thank You for Your Order!</h2>
                <p>Dear ${customerName},</p>
                <p>We're excited to confirm your order. Your dream car is being prepared with the utmost care and attention to detail.</p>
                
                <div class="order-details">
                  <h3>Order Details</h3>
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleDateString()}</p>
                  <p><strong>Car Model:</strong> ${carName}</p>
                  
                  ${customizationsList ? `
                    <h4>Customizations:</h4>
                    <ul>${customizationsList}</ul>
                  ` : ''}
                  
                  <div class="total">
                    Total: $${totalPrice.toLocaleString()}
                  </div>
                </div>

                <h3>📦 Delivery Options</h3>
                <p>Our team will contact you within 24-48 hours to discuss delivery options:</p>
                <ul>
                  <li><strong>White Glove Delivery:</strong> Professional delivery to your location</li>
                  <li><strong>Showroom Pickup:</strong> Pick up your vehicle at our luxury showroom</li>
                  <li><strong>Concierge Service:</strong> Premium delivery with full vehicle orientation</li>
                </ul>

                <h3>What's Next?</h3>
                <ol>
                  <li>Our customization team will begin working on your vehicle</li>
                  <li>You'll receive progress updates via email</li>
                  <li>A delivery specialist will contact you to arrange delivery</li>
                  <li>Final inspection and handover of your dream car</li>
                </ol>

                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Best regards,<br><strong>The MARQUE DESIGN Team</strong></p>
              </div>
              <div class="footer">
                <p>&copy; 2024 MARQUE DESIGN. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Order confirmation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send order confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send delivery update email
  async sendDeliveryUpdate(customerEmail, customerName, deliveryDetails) {
    try {
      const { orderId, carName, deliveryOption, estimatedDate, trackingInfo } = deliveryDetails;

      const mailOptions = {
        from: `"MARQUE DESIGN" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        replyTo: process.env.EMAIL_USER,
        subject: `Delivery Update - ${orderId}`,
        text: `
MARQUE DESIGN - Delivery Update

Your ${carName} is Ready!

Dear ${customerName},

Great news! Your customized vehicle is ready for delivery.

Delivery Information:
- Order ID: ${orderId}
- Delivery Option: ${deliveryOption}
- Estimated Delivery: ${estimatedDate}
${trackingInfo ? `- Tracking: ${trackingInfo}` : ''}

Our delivery team will contact you shortly to confirm the final details.

Best regards,
The MARQUE DESIGN Team
        `,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a1a1a, #2d2d2d); color: #d4af37; padding: 30px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .delivery-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚗 Delivery Update</h1>
              </div>
              <div class="content">
                <h2>Your ${carName} is Ready!</h2>
                <p>Dear ${customerName},</p>
                <p>Great news! Your customized vehicle is ready for delivery.</p>
                
                <div class="delivery-box">
                  <h3>Delivery Information</h3>
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Delivery Option:</strong> ${deliveryOption}</p>
                  <p><strong>Estimated Delivery:</strong> ${estimatedDate}</p>
                  ${trackingInfo ? `<p><strong>Tracking:</strong> ${trackingInfo}</p>` : ''}
                </div>

                <p>Our delivery team will contact you shortly to confirm the final details.</p>
                <p>Best regards,<br><strong>The MARQUE DESIGN Team</strong></p>
              </div>
              <div class="footer">
                <p>&copy; 2024 MARQUE DESIGN. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Delivery update email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send delivery update email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send order status update email
  async sendOrderStatusUpdate(customerEmail, customerName, statusDetails) {
    try {
      const { orderId, carName, status, orderDate } = statusDetails;

      // Define status-specific content
      const statusContent = {
        pending: {
          subject: 'Order Received',
          title: '📋 Order Received',
          message: 'We have received your order and it is currently being reviewed by our team.',
          nextSteps: [
            'Our team is reviewing your customization requirements',
            'Payment verification is in progress',
            'You will receive a confirmation email once approved'
          ],
          color: '#ffa502'
        },
        confirmed: {
          subject: 'Order Confirmed',
          title: '✅ Order Confirmed',
          message: 'Great news! Your order has been confirmed and approved.',
          nextSteps: [
            'Your order has been added to our production queue',
            'Our customization team will begin preparing your vehicle',
            'You will receive updates as work progresses'
          ],
          color: '#2ed573'
        },
        processing: {
          subject: 'Order in Production',
          title: '⚙️ Order in Production',
          message: 'Your custom vehicle is now being built by our expert craftsmen.',
          nextSteps: [
            'Our team is actively working on your customizations',
            'Quality checks are being performed at each stage',
            'You will be notified once production is complete'
          ],
          color: '#3742fa'
        },
        shipped: {
          subject: 'Order Shipped',
          title: '🚚 Order Shipped',
          message: 'Exciting news! Your vehicle has been shipped and is on its way to you.',
          nextSteps: [
            'Your vehicle is in transit to the delivery location',
            'Our delivery team will contact you to schedule arrival',
            'Track your shipment using the tracking information provided'
          ],
          color: '#5352ed'
        },
        delivered: {
          subject: 'Order Delivered',
          title: '🎉 Order Delivered',
          message: 'Congratulations! Your custom vehicle has been delivered.',
          nextSteps: [
            'Enjoy your new luxury vehicle!',
            'Please complete the delivery inspection checklist',
            'Contact us if you have any questions or concerns'
          ],
          color: '#2f3542'
        },
        cancelled: {
          subject: 'Order Cancelled',
          title: '❌ Order Cancelled',
          message: 'Your order has been cancelled as requested.',
          nextSteps: [
            'Refund processing will begin within 3-5 business days',
            'You will receive a confirmation once the refund is complete',
            'Feel free to place a new order anytime'
          ],
          color: '#ff4757'
        }
      };

      const content = statusContent[status] || statusContent.pending;

      const mailOptions = {
        from: `"MARQUE DESIGN" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        replyTo: process.env.EMAIL_USER,
        subject: `${content.subject} - Order ${orderId}`,
        text: `
MARQUE DESIGN - Order Status Update

${content.title}

Dear ${customerName},

${content.message}

Order Details:
- Order ID: ${orderId}
- Car Model: ${carName}
- Order Date: ${new Date(orderDate).toLocaleDateString()}
- Current Status: ${status.toUpperCase()}

What's Next:
${content.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

If you have any questions about your order, please don't hesitate to contact us.

Best regards,
The MARQUE DESIGN Team
        `,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a1a1a, #2d2d2d); color: #d4af37; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f9f9f9; padding: 30px; }
              .status-banner { background: ${content.color}; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; font-size: 24px; font-weight: bold; }
              .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${content.color}; }
              .next-steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .next-steps ol { padding-left: 20px; }
              .next-steps li { padding: 8px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>MARQUE DESIGN</h1>
                <p>Luxury Car Customization</p>
              </div>
              <div class="content">
                <div class="status-banner">
                  ${content.title}
                </div>
                
                <p>Dear ${customerName},</p>
                <p>${content.message}</p>
                
                <div class="order-details">
                  <h3>Order Details</h3>
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Car Model:</strong> ${carName}</p>
                  <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleDateString()}</p>
                  <p><strong>Current Status:</strong> <span style="color: ${content.color}; font-weight: bold;">${status.toUpperCase()}</span></p>
                </div>

                <div class="next-steps">
                  <h3>What's Next?</h3>
                  <ol>
                    ${content.nextSteps.map(step => `<li>${step}</li>`).join('')}
                  </ol>
                </div>

                <p>If you have any questions about your order, please don't hesitate to contact us.</p>
                <p>Best regards,<br><strong>The MARQUE DESIGN Team</strong></p>
              </div>
              <div class="footer">
                <p>&copy; 2025 MARQUE DESIGN. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Order status update email sent (${status}):`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send order status update email:', error);
      return { success: false, error: error.message };
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
