<?php
$time_exec = false; //Показывает затраченное время на выполнение одного запроса;
$global_settings = [];
$global_settings['main_title'] = "";
$global_settings['ch_p_u_mode'] = true;
$global_settings['max_login_attempts'] = 10;
$global_settings['smtp_address'] = '';
$global_settings['smtp_port'] = 25;
$global_settings['smtp_login'] = '';
$global_settings['smtp_from'] = '';
$global_settings['smtp_from_name'] = '';
$global_settings['smtp_password'] = '';
$global_settings['sms.ru_api_id'] = "";
$global_settings["background_job_sec_key"] = "";
if(is_get('css_js_minify'))
    $_SESSION['css_js_minify'] = to_boolean(get_request('css_js_minify'));
$global_settings['css_js_minify'] = isset($_SESSION['css_js_minify']) ? $_SESSION['css_js_minify'] : true;

$global_settings["re_captcha"]['disable'] = false;
$global_settings["re_captcha"]["publickey"] = "";
$global_settings["re_captcha"]["privatekey"] = "";

$is_local_host = false;
switch (get_http_host_name()) {
    case '192.168.0.3':
    case "localhost":
        $is_local_host = true;
        break;
}

$global_settings['global_js'] = array("jquery-3.2.1" . ($global_settings['css_js_minify'] ? '.min' : '') . ".js",
    "jquery.json.min.js", "browsers_scanner.js", "jquery.css_animator.js", "jquery.touch.js",
    "jquery.smart_hover.js", "jquery.cookie.js");

//****************************************Настройки MySQLi*****************************************************************
$global_settings['mysqli']["host"] = "localhost";
$global_settings['mysqli']["db_name"] = '';
$global_settings['mysqli']["user"] = $is_local_host ? "" : "";
$global_settings['mysqli']["password"] = $is_local_host ? '' : "";
$global_settings['mysqli']["table_prefix"] = '';
//******************************Настройки модулей***************************************************
$module_settings['smart_text_box']['extend_editor_debug_mode'] = !$global_settings['css_js_minify'];
$module_settings['smart_text_box']['debug_mode'] = !$global_settings['css_js_minify'];
$module_settings['error_notifier']['is_enable'] = true;
$module_settings['error_notifier']['ignore_pattern'] = '/(NOTICE\: PHP message\: PHP Warning\:  Cannot modify header information \- headers already sent by|script \'.*\' not found or unable to stat|client denied by server configuration: \/usr\/share\/phpmyadmin|\[autoindex:error\]|AH02032)/ui';
$module_settings['error_notifier']['report_emails'] = "";
$module_settings['error_notifier']['log_path'] = '';


if(is_get('to_mobile')) {
    set_mobile_device(true);
    redirect("", get_referer());
}

if(is_get('to_desktop')) {
    set_mobile_device(false);
    redirect("", get_referer());
}

$start_template =  "test/main";