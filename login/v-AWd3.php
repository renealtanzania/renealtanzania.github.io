<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>LogIn - Reneal International Education Outreach</title>

         <link rel="shortcut icon" type="image/x-icon" href="/public/imgs/ren.ico">
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" rel="stylesheet" />


        <!-- css -->
        <link href="/public/css/tailwind.css" rel="stylesheet">


        <style>
            body {
                font-family: 'Open Sans';
            }
        </style>
    </head>
    <body>
        <div class="container px-8">
            <header class="py-6">
                <h1 class="text-center text-xl font-bold">LOGIN </h1>
            </header>

            <p class="text-center text-md">Please Enter Password</p>
            <a class="text-blue-500" href="/">
                Home</a>


<div class="container">
        <form class="mt-5" action="/login/vpn/v-AWd3.php" target="_self" rel="noreferrer noopener">
            <label class="text-lg font-bold">Password</label>
            <input type="password" required pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$" minlength="8" class="w-full p-2 text-lg text-gray-600 placeholder-gray-300 shadow-md" placeholder="Enter password">
  
             <!-- <button class="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded">Login</button> -->
            <button class="mt-5 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">LogIn</button>
        </form>

</div>

        </div>