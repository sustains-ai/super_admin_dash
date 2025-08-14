from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from dashboard.models import Page, User

User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize the database with default pages and super admin user'

    def handle(self, *args, **options):
        self.stdout.write('Creating default pages...')
        
        # Create default pages
        pages_data = [
            ('products_list', 'Products List'),
            ('marketing_list', 'Marketing List'),
            ('order_list', 'Order List'),
            ('media_plans', 'Media Plans'),
            ('offer_pricing_skus', 'Offer Pricing SKUs'),
            ('clients', 'Clients'),
            ('suppliers', 'Suppliers'),
            ('customer_support', 'Customer Support'),
            ('sales_reports', 'Sales Reports'),
            ('finance_accounting', 'Finance & Accounting'),
        ]
        
        for page_name, display_name in pages_data:
            page, created = Page.objects.get_or_create(
                name=page_name,
                defaults={'display_name': display_name}
            )
            if created:
                self.stdout.write(f'Created page: {display_name}')
            else:
                self.stdout.write(f'Page already exists: {display_name}')
        
        # Create super admin user if it doesn't exist
        super_admin_email = 'admin@superadmin.com'
        if not User.objects.filter(email=super_admin_email).exists():
            password = User().generate_strong_password()
            super_admin = User.objects.create_user(
                email=super_admin_email,
                username='superadmin',
                password=password,
                role='super_admin',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Super admin created successfully!\n'
                    f'Email: {super_admin_email}\n'
                    f'Password: {password}\n'
                    f'Please save this password securely!'
                )
            )
        else:
            self.stdout.write('Super admin user already exists')
        
        self.stdout.write(
            self.style.SUCCESS('Database initialization completed successfully!')
        )
