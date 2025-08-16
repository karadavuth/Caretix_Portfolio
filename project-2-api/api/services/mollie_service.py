import mollie
from django.conf import settings
from decimal import Decimal
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class MollieService:
    def __init__(self):
        self.client = mollie.Client()
        self.client.set_api_key(settings.MOLLIE_API_KEY)
    
    def create_payment(self, order):
        """
        Create a Mollie payment for the given order
        """
        try:
            # Determine payment method specifics
            payment_methods = []
            if order.payment_method == 'ideal':
                payment_methods = ['ideal']
            elif order.payment_method == 'creditcard':
                payment_methods = ['creditcard']
            elif order.payment_method == 'paypal':
                payment_methods = ['paypal']
            
            # Create payment with Mollie
            payment = self.client.payments.create({
                'amount': {
                    'currency': 'EUR',
                    'value': str(order.total_amount)
                },
                'description': f'HealClinics Bestelling {order.order_number}',
                'redirectUrl': f'{settings.FRONTEND_URL}/checkout/return/{order.uuid}/',
                'webhookUrl': settings.MOLLIE_WEBHOOK_URL,
                'method': payment_methods,
                'metadata': {
                    'order_id': str(order.id),
                    'order_number': order.order_number,
                    'customer_email': order.customer_email,
                }
            })
            
            # Update order with Mollie payment info
            order.payment_reference = payment.id
            order.save()
            
            # Create payment transaction record (we'll add PaymentTransaction model later)
            logger.info(f"Created Mollie payment {payment.id} for order {order.order_number}")
            
            return {
                'success': True,
                'payment_id': payment.id,
                'checkout_url': payment.checkout_url,
                'status': payment.status
            }
            
        except Exception as e:
            logger.error(f"Failed to create Mollie payment for order {order.order_number}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_payment_status(self, payment_id):
        """
        Get current payment status from Mollie
        """
        try:
            payment = self.client.payments.get(payment_id)
            return {
                'success': True,
                'status': payment.status,
                'payment': payment
            }
        except Exception as e:
            logger.error(f"Failed to get payment status for {payment_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_webhook(self, payment_id):
        """
        Process Mollie webhook for payment status update
        """
        try:
            # Get payment from Mollie
            payment = self.client.payments.get(payment_id)
            
            # Find corresponding order
            from api.models import Order
            
            try:
                order = Order.objects.get(payment_reference=payment_id)
            except Order.DoesNotExist:
                logger.error(f"No order found for payment {payment_id}")
                return False
            
            # Update order based on payment status
            if payment.status == 'paid':
                order.payment_status = 'paid'
                order.status = 'processing'
                
                # Send confirmation email (implement later)
                self._send_order_confirmation(order)
                
            elif payment.status in ['failed', 'expired', 'cancelled']:
                order.payment_status = 'failed'
                order.status = 'cancelled'
            
            order.save()
            
            logger.info(f"Processed webhook for payment {payment_id}, status: {payment.status}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to process webhook for payment {payment_id}: {str(e)}")
            return False
    
    def _send_order_confirmation(self, order):
        """
        Send order confirmation email (placeholder - implement in next step)
        """
        logger.info(f"Would send confirmation email for order {order.order_number}")
        pass
