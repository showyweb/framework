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
session_start(['cookie_httponly' => true, 'cookie_lifetime' => 86400]);
if(isset($_COOKIE['PHPSESSID']))
    setcookie('PHPSESSID', $_COOKIE['PHPSESSID'], time() + 86400, "", "", false, true);
?>