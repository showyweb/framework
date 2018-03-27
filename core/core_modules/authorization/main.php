<?php

class authorization
{
    function __construct()
    {
        global $vers;
        $settings = get_settings(null, 'global');

        head_manager::import_js('authorization.js');
        head_manager::import_css("authorization.css");
        $authorization = new authorization_ext();

        if(is_get('authorization')) {
            switch (get_request('authorization')) {
                case 'new_user':
                    $authorization->new_user();
                    return;
                case 'key_validate':
                    $authorization->reg_new(false, get_request('key'));
                    return;
                case 'password_edit':
                    $authorization->edit_password($_SESSION['login'], get_request('password'), get_request('new_password'), get_request('new_password_check'));
                    break;
                case 'login':
                    $authorization->authorization(get_request('login'), get_request('password'), $vers);
                    break;
                case 'exit_user':
                    $authorization->deauthorization();
                    break;
                case 'notify_contacts_test':
                    $authorization->notify_contacts_test(get_request('phone'), get_request('email'), get_request('sms_ru_api_id'), get_request('sipnet_ru_id', false), get_request('sipnet_ru_password', false));
                    return;
                case 'notify_contacts_save':
                    $authorization->set_notify_contacts($_SESSION['login'], get_request('email'), get_request('phone'), get_request('sms_ru_api_id'), get_request('sipnet_ru_id', false), get_request('sipnet_ru_password', false), get_request('call_hour_start'), get_request('call_hour_end'));
                    break;
            }

        }
        if(isset($settings["once_reg"]) and $settings["once_reg"]) {
            $authorization->reg_new(true);
            return;
        }

        $authorization->get_main_html();
    }
}