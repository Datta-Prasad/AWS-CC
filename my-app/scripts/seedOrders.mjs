import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { signIn } from 'aws-amplify/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// TEST CREDENTIALS TO REPLACE
// Pass via CLI args: node scripts/seedOrders.mjs <email> <password>
// Or update default values below:
// ============================================================================
const TEST_EMAIL = process.argv[2] || 'testuser@example.com';
const TEST_PASSWORD = process.argv[3] || 'Password123!';

// Load amplify_outputs.json
const outputsPath = resolve(__dirname, '../amplify_outputs.json');
const amplifyOutputs = JSON.parse(readFileSync(outputsPath, 'utf8'));

// Configure Amplify
Amplify.configure(amplifyOutputs);

const client = generateClient();

const sampleOrders = [
  {
    customerName: 'Alice Johnson',
    customerEmail: 'alice.johnson@example.com',
    deliveryAddress: '742 Evergreen Terrace, Springfield, OR',
    status: 'PLACED',
    items: [
      { productName: 'Margherita Pizza', quantity: 2, price: 14.99 },
      { productName: 'Garlic Breadsticks', quantity: 1, price: 5.99 }
    ]
  },
  {
    customerName: 'Bob Smith',
    customerEmail: 'bob.smith@example.com',
    deliveryAddress: '100 Market St, San Francisco, CA',
    status: 'CONFIRMED',
    items: [
      { productName: 'Classic Cheeseburger', quantity: 2, price: 11.50 },
      { productName: 'French Fries', quantity: 2, price: 3.99 },
      { productName: 'Chocolate Milkshake', quantity: 1, price: 4.99 }
    ]
  },
  {
    customerName: 'Charlie Brown',
    customerEmail: 'charlie.brown@example.com',
    deliveryAddress: '123 Peanuts Lane, Minneapolis, MN',
    status: 'PREPARING',
    items: [
      { productName: 'Pepperoni Pizza', quantity: 1, price: 16.99 },
      { productName: 'Caesar Salad', quantity: 1, price: 8.50 },
      { productName: 'Iced Tea', quantity: 2, price: 2.50 }
    ]
  },
  {
    customerName: 'Diana Prince',
    customerEmail: 'diana.prince@example.com',
    deliveryAddress: '456 Wonder Way, Washington, DC',
    status: 'OUT_FOR_DELIVERY',
    items: [
      { productName: 'Sushi Combo Platter', quantity: 1, price: 28.00 },
      { productName: 'Miso Soup', quantity: 2, price: 3.50 }
    ]
  },
  {
    customerName: 'Ethan Hunt',
    customerEmail: 'ethan.hunt@example.com',
    deliveryAddress: '789 Mission Blvd, Los Angeles, CA',
    status: 'DELIVERED',
    items: [
      { productName: 'BBQ Ribs Rack', quantity: 1, price: 24.99 },
      { productName: 'Coleslaw', quantity: 1, price: 4.00 },
      { productName: 'Craft Beer 6-Pack', quantity: 1, price: 12.00 }
    ]
  },
  {
    customerName: 'Fiona Gallagher',
    customerEmail: 'fiona.g@example.com',
    deliveryAddress: '2111 S Wallace St, Chicago, IL',
    status: 'PLACED',
    items: [
      { productName: 'Chicken Tikka Masala', quantity: 2, price: 15.99 },
      { productName: 'Garlic Naan', quantity: 3, price: 3.25 },
      { productName: 'Mango Lassi', quantity: 2, price: 4.50 }
    ]
  },
  {
    customerName: 'George Clark',
    customerEmail: 'george.clark@example.com',
    deliveryAddress: '55 Ocean Drive, Miami, FL',
    status: 'CONFIRMED',
    items: [
      { productName: 'Fish & Chips', quantity: 2, price: 13.75 },
      { productName: 'Tartar Sauce Extra', quantity: 1, price: 1.00 }
    ]
  },
  {
    customerName: 'Hannah Abbott',
    customerEmail: 'hannah.a@example.com',
    deliveryAddress: '12 Grimmauld Pl, Boston, MA',
    status: 'PREPARING',
    items: [
      { productName: 'Veggie Supreme Pizza', quantity: 1, price: 17.50 },
      { productName: 'Mozzarella Sticks', quantity: 1, price: 7.99 },
      { productName: 'Lemonade', quantity: 2, price: 3.00 }
    ]
  },
  {
    customerName: 'Ian Malcolm',
    customerEmail: 'ian.m@example.com',
    deliveryAddress: '99 Jurassic Park Rd, Austin, TX',
    status: 'OUT_FOR_DELIVERY',
    items: [
      { productName: 'T-Bone Steak', quantity: 1, price: 32.00 },
      { productName: 'Mashed Potatoes', quantity: 1, price: 5.50 },
      { productName: 'Red Wine Glass', quantity: 1, price: 9.00 }
    ]
  }
];

async function seed() {
  console.log('--- Starting Seed Script ---');
  console.log(`Signing in with credentials for: ${TEST_EMAIL}...`);

  try {
    const signInResult = await signIn({
      username: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!signInResult.isSignedIn) {
      console.error('Sign-in failed or requires next steps:', signInResult);
      process.exit(1);
    }

    console.log('Successfully signed in!');
    let count = 0;

    for (const orderData of sampleOrders) {
      const totalAmount = Number(
        orderData.items.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)
      );

      const input = {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        deliveryAddress: orderData.deliveryAddress,
        status: orderData.status,
        items: JSON.stringify(orderData.items),
        totalAmount
      };

      const { data: createdOrder, errors } = await client.models.Order.create(input);

      if (errors && errors.length > 0) {
        console.error(`Error creating order for ${orderData.customerName}:`, errors);
      } else if (createdOrder) {
        count++;
        console.log(`[Order #${count}] ID: ${createdOrder.id} | Customer: ${createdOrder.customerName} | Status: ${createdOrder.status} | Total: $${createdOrder.totalAmount}`);
      }
    }

    console.log(`\nSuccessfully created ${count} sample orders.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed orders:', err);
    process.exit(1);
  }
}

seed();
