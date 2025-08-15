from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from dashboard.models import Page, User, Permission

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

        created_pages = []
        for page_name, display_name in pages_data:
            page, created = Page.objects.get_or_create(
                name=page_name,
                defaults={'display_name': display_name}
            )
            created_pages.append(page)
            if created:
                self.stdout.write(f'Created page: {display_name}')
            else:
                self.stdout.write(f'Page already exists: {display_name}')

        # Create super admin user if it doesn't exist
        super_admin_email = 'admin@superadmin.com'
        super_admin = None
        
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
            super_admin = User.objects.get(email=super_admin_email)
            self.stdout.write('Super admin user already exists')

        # Give super admin full permissions for all pages
        if super_admin:
            self.stdout.write('Setting up super admin permissions...')
            for page in created_pages:
                # Create permissions for all permission types
                for permission_type in ['view', 'edit', 'create', 'delete']:
                    permission, created = Permission.objects.get_or_create(
                        user=super_admin,
                        page=page,
                        permission_type=permission_type,
                        defaults={'granted_by': super_admin}
                    )
                    if created:
                        self.stdout.write(f'Granted {permission_type} permission for {page.display_name}')
                    else:
                        self.stdout.write(f'{permission_type} permission already exists for {page.display_name}')

        self.stdout.write(
            self.style.SUCCESS('Database initialization completed successfully!')
        )
