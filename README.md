# Shopper Backend API Documentation

This repository contains backend API endpoints for an E-Commerce application. The API is built using Node.js, Express,
and MongoDB. It includes functionality for managing products, categories, orders, users, and authentication.

## Postman Documentation

https://documenter.getpostman.com/view/18462993/2sA3JM7226

## Deployed URL

https://shopper-puce.vercel.app/v1/api

## Technologies Used

- **Node.js and Express**: For building the RESTful API.
- **MongoDB**: As the database for storing application data.
- **Docker**: For containerizing the application and ensuring consistent environments across development, testing, and
  production.
- **Redis**: For caching data to improve performance and reduce database load.
- **Nginx**: As a reverse proxy to route requests to the application and for load balancing.

## Features

- **Products**: CRUD operations for managing products, including adding, updating, deleting, and fetching products.
- **Categories**: CRUD operations for managing product categories.
- **Orders**: Creating orders, marking orders as paid or delivered, and fetching order details.
- **Users**: User authentication, registration, login, profile management, and role assignment.
- **Authentication**: Support for user authentication using JWT tokens.
- **Notification**: Sending notifications to users via email and sms using Twilio.
- **Miscellaneous**: Additional features like fetching total orders, calculating total sales, and more.

## API Endpoints

All API endpoints are prefixed with the base URL `/v1/api`. For example, to create a category, you would send a POST
request to `/v1/api/categories`.

### Category Routes

- **POST** `/v1/api/categories` - Create a new category (requires admin authorization)
- **GET** `/v1/api/categories` - Retrieve all categories
- **GET** `/v1/api/categories/:id` - Retrieve a specific category by ID
- **PUT** `/v1/api/categories/:id` - Update a category by ID (requires admin authorization)
- **DELETE** `/v1/api/categories/:id` - Delete a category by ID (requires admin authorization)

### Order Routes

- **POST** `/v1/api/orders` - Create a new order (requires authentication)
- **GET** `/v1/api/orders` - Retrieve all orders (requires admin authorization)
- **GET** `/v1/api/orders/mine` - Retrieve orders for the authenticated user
- **GET** `/v1/api/orders/total-orders` - Retrieve the total number of orders
- **GET** `/v1/api/orders/total-sales` - Calculate the total sales amount
- **GET** `/v1/api/orders/total-sales-by-date` - Calculate total sales grouped by date
- **GET** `/v1/api/orders/:id` - Retrieve a specific order by ID (requires authentication)
- **PUT** `/v1/api/orders/:id/pay` - Mark an order as paid (requires authentication)
- **PUT** `/v1/api/orders/:id/deliver` - Mark an order as delivered (requires admin authorization)

### Product Routes

- **POST** `/v1/api/products` - Add a new product (requires admin authorization)
- **GET** `/v1/api/products/all-products` - Retrieve all products
- **POST** `/v1/api/products/:id/reviews` - Add a review for a product (requires authentication)
- **POST** `/v1/api/products/filtered-products` - Filter products based on category and price range
- **GET** `/v1/api/products/top` - Retrieve top-rated products
- **GET** `/v1/api/products/new` - Retrieve newly added products
- **GET** `/v1/api/products/:id` - Retrieve a specific product by ID
- **PUT** `/v1/api/products/:id` - Update a product by ID (requires admin authorization)
- **DELETE** `/v1/api/products/:id` - Delete a product by ID (requires admin authorization)

### User Routes

- **POST** `/v1/api/auth/register` - Create a new user
- **POST** `/v1/api/auth/login` - Log in a user
- **POST** `/v1/api/auth/change-password` - Change user's password
- **POST** `/v1/api/auth/verify-email` - Verify user's email
- **POST** `/v1/api/auth/resendVerificationCode` - Resend verification code
- **POST** `/v1/api/auth/resendResetToken` - Resend reset token
- **POST** `/v1/api/auth/forgotPassword` - Send reset password email
- **PUT** `/v1/api/auth/resetPassword` - Reset user's password
- **POST** `/v1/api/auth/logout` - Log out the current user
- **GET** `/v1/api/users` - Retrieve all users (requires admin authorization)
- **GET** `/v1/api/users/profile` - Retrieve current user's profile (requires authentication)
- **PUT** `/v1/api/users/profile` - Update current user's profile (requires authentication)
- **DELETE** `/v1/api/users/:id` - Delete a user by ID (requires admin authorization)
- **GET** `/v1/api/users/:id` - Retrieve a user by ID (requires admin authorization)
- **PUT** `/v1/api/users/:id` - Update a user by ID (requires admin authorization)
- **PUT** `/v1/api/users/assign-role/:id` - Assign a role to a user (requires admin authorization)
- **PUT** `/v1/api/users/delete-role/:id` - Delete a role from a user (requires admin authorization)

### Upload Routes

- **POST** `/v1/api/upload/local` - Upload an image locally
- **POST** `/v1/api/upload/cloudinary` - Upload an image to Cloudinary

### User Location Routes

- **POST** `/v1/api/location` - Retrieve and save the current location of a user

## Docker and Nginx Setup

To run the application using Docker and Nginx, follow these steps:

1. Ensure Docker and Docker Compose are installed on your system.
2. Navigate to the root directory of the project.
3. Build and start the containers using Docker Compose: `docker-compose up`

This command will start the application, MongoDB, Redis, and Nginx services as defined in the `docker-compose.yml` file.
Nginx will be configured to act as a reverse proxy, directing traffic to the application container.

## Redis Caching

Redis is used in this project to cache frequently accessed data. To connect to the Redis instance, ensure that the Redis
service is running and that the correct connection string is provided in the environment variables.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (e.g., MongoDB connection string, Cloudinary credentials, `API_BASE_URL`)
4. Start the server: `npm start`

## Contributors

- [Chukwu Chidiebere John](https://github.com/johnkrator)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
