# Shopper Backend API Documentation

This repository contains backend API endpoints for an E-Commerce application. The API is built using Node.js, Express,
and MongoDB. It includes functionality for managing products, categories, orders, users, and authentication.

## Postman Documentation

https://documenter.getpostman.com/view/18462993/2sA3JM7226

## Deployed URL

https://shopper-puce.vercel.app/v1/api

## Features

- **Products**: CRUD operations for managing products, including adding, updating, deleting, and fetching products.
- **Categories**: CRUD operations for managing product categories.
- **Orders**: Creating orders, marking orders as paid or delivered, and fetching order details.
- **Users**: User authentication, registration, login, profile management, and role assignment.
- **Authentication**: Support for user authentication using JWT tokens.
- **Miscellaneous**: Additional features like fetching total orders, calculating total sales, and more.

## API Endpoints

## Category Routes

### Create a Category

- **POST** `/api/categories`
    - Requires authentication and admin authorization
    - Creates a new category

### Get All Categories

- **GET** `/api/categories`
    - Retrieves all categories

### Get a Category by ID

- **GET** `/api/categories/:id`
    - Retrieves a specific category by ID

### Update a Category

- **PUT** `/api/categories/:id`
    - Requires authentication and admin authorization
    - Updates a category by ID

### Delete a Category

- **DELETE** `/api/categories/:id`
    - Requires authentication and admin authorization
    - Deletes a category by ID

## Order Routes

### Create an Order

- **POST** `/api/orders`
    - Requires authentication
    - Creates a new order

### Get All Orders

- **GET** `/api/orders`
    - Requires authentication and admin authorization
    - Retrieves all orders

### Get User's Orders

- **GET** `/api/orders/mine`
    - Requires authentication
    - Retrieves orders for the authenticated user

### Get Total Number of Orders

- **GET** `/api/orders/total-orders`
    - Retrieves the total number of orders

### Get Total Sales

- **GET** `/api/orders/total-sales`
    - Calculates the total sales amount

### Get Total Sales by Date

- **GET** `/api/orders/total-sales-by-date`
    - Calculates total sales grouped by date

### Get Order by ID

- **GET** `/api/orders/:id`
    - Requires authentication
    - Retrieves a specific order by ID

### Mark Order as Paid

- **PUT** `/api/orders/:id/pay`
    - Requires authentication
    - Marks an order as paid

### Mark Order as Delivered

- **PUT** `/api/orders/:id/deliver`
    - Requires authentication and admin authorization
    - Marks an order as delivered

## Product Routes

### Add a Product

- **POST** `/api/products`
    - Requires authentication and admin authorization
    - Adds a new product

### Get All Products

- **GET** `/api/products/all-products`
    - Retrieves all products

### Add Product Review

- **POST** `/api/products/:id/reviews`
    - Requires authentication
    - Adds a review for a product

### Filter Products

- **POST** `/api/products/filtered-products`
    - Filters products based on category and price range

### Get Top Products

- **GET** `/api/products/top`
    - Retrieves top-rated products

### Get New Products

- **GET** `/api/products/new`
    - Retrieves newly added products

### Get Product by ID

- **GET** `/api/products/:id`
    - Retrieves a specific product by ID

### Update a Product

- **PUT** `/api/products/:id`
    - Requires authentication and admin authorization
    - Updates a product by ID

### Delete a Product

- **DELETE** `/api/products/:id`
    - Requires authentication and admin authorization
    - Deletes a product by ID

## User Routes

### Create a User

- **POST** `/api/users`
    - Creates a new user

### Login User

- **POST** `/api/users/login`
    - Logs in a user

### Change Password

- **POST** `/api/users/change-password`
    - Changes user's password

### Verify Email

- **POST** `/api/users/verify-email`
    - Verifies user's email

### Resend Verification Code

- **POST** `/api/users/resendVerificationCode`
    - Resends verification code

### Resend Reset Token

- **POST** `/api/users/resendResetToken`
    - Resends reset token

### Forgot Password

- **POST** `/api/users/forgotPassword`
    - Sends reset password email

### Reset Password

- **PUT** `/api/users/resetPassword`
    - Resets user's password

### Logout User

- **POST** `/api/users/logout`
    - Logs out the current user

### OAuth Routes

- **POST** `/api/users/google`
    - Handles Google authentication
- **POST** `/api/users/facebook`
    - Handles Facebook authentication
- **POST** `/api/users/github`
    - Handles GitHub authentication
- **POST** `/api/users/apple`
    - Handles Apple authentication

### Get All Users

- **GET** `/api/users`
    - Requires authentication and admin authorization
    - Retrieves all users

### Get Current User Profile

- **GET** `/api/users/profile`
    - Requires authentication
    - Retrieves current user's profile

### Update Current User Profile

- **PUT** `/api/users/profile`
    - Requires authentication
    - Updates current user's profile

### Delete User by ID

- **DELETE** `/api/users/:id`
    - Requires authentication and admin authorization
    - Deletes a user by ID

### Get User by ID

- **GET** `/api/users/:id`
    - Requires authentication and admin authorization
    - Retrieves a user by ID

### Update User by ID

- **PUT** `/api/users/:id`
    - Requires authentication and admin authorization
    - Updates a user by ID

### Assign Role to User

- **PUT** `/api/users/assign-role/:id`
    - Requires authentication and admin authorization
    - Assigns a role to a user

### Delete Role from User

- **PUT** `/api/users/delete-role/:id`
    - Requires authentication and admin authorization
    - Deletes a role from a user

## Upload Routes

### Upload Image Locally

- **POST** `/api/upload/local`
    - Uploads an image locally

### Upload Image to Cloudinary

- **POST** `/api/upload/cloudinary`
    - Uploads an image to Cloudinary

## User Location Routes

### Get Current Location

- **POST** `/api/location`
    - Retrieves and saves the current location of a user

---

This API documentation provides a comprehensive guide to the available endpoints and their functionalities. Please refer
to the specific routes for detailed usage instructions.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (e.g., MongoDB connection string, Cloudinary credentials)
4. Start the server: `npm start`

## Contributors

- [Chukwu Chidiebere John](https://github.com/johnkrator)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
