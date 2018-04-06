<?php

if(isset($_SERVER['HTTP_X_REAL_IP']))
    $_SERVER['REMOTE_ADDR'] = $_SERVER['HTTP_X_REAL_IP'];
if(isset($_SERVER['HTTP_X_FORWARDED_FOR']))
    $porxy = $_SERVER['HTTP_X_FORWARDED_FOR'];
else
    $porxy = "no";
if(isset($_SERVER['HTTP_USER_AGENT']))
    $vers = md5($_SERVER['HTTP_USER_AGENT'] . $_SERVER['REMOTE_ADDR'] . $porxy . $_SERVER['SERVER_NAME']);
else
    $vers = md5($_SERVER['REMOTE_ADDR'] . $porxy . $_SERVER['SERVER_NAME']);

//$text = file_get_contents("test.log");
//file_put_contents("test.log", $text . "\n" . $_SERVER['REMOTE_ADDR'] . " - 1 -" . date("Y-m-d H:i:s"));

session_start(['cookie_httponly' => true, 'cookie_lifetime' => 86400]);

//$text = file_get_contents("test.log");
//file_put_contents("test.log", $text . "\n" . $_SERVER['REMOTE_ADDR'] . " - 2 -" . date("Y-m-d H:i:s"));


if(isset($_COOKIE['PHPSESSID']))
    setcookie('PHPSESSID', $_COOKIE['PHPSESSID'], time() + 86400, "", "", false, true);




?>