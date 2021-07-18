<?php

class authorization_ext extends authorization_api
{

    private $as_obj = null;

    public function __construct()
    {
        parent::__construct();
        $this->as_obj = new anti_spam();
    }

    function new_user()
    {
        return "";//Отключено в целях безопасности. Нужно доработать
        $as_obj = $this->as_obj;
        $data_base64 = '<div class="login_form" style="display:none;">';
        if(!static::is_admin() and $as_obj->is_captcha()) {
            $data_base64 .= '
    <form action="" method="post">' . anti_spam::get_captcha_html() . '
    <br/>
    <input type="submit" value="Далее" />
    </form>';
        } else {
            $er = false;
            $send_email = false;
            if(is_get('email'))
                if(!preg_match("/^([0-9a-z]([-_.]?[0-9a-z])*@[0-9a-z]([-.]?[0-9a-z])*\\.[a-wyz][a-z](fo|g|l|m|mes|o|op|pa|ro|seum|t|u|v|z)?)$/i", get_request('email')) or get_request('email') == "") {
                    $er = true;
                } else {
                    $send_email = true;
                }
            if(!$send_email) {
                $data_base64 .= '<form method="post" action="">
	<table cellpadding="0" cellspacing="0">';
                if($er)
                    $data_base64 .= '<tr><td colspan="2"><span style="color:red;">Вы ввели некорректный e-mail адрес!</span></td></tr>';
                $data_base64 .= '<tr><td>Адрес вашей электронной почты: </td><td><input type="text" name="email" value="" /></td></tr></table>
                    <br/>
    <input type="submit" value="Далее" />
    </form>';
            } else {
                $as_obj->enable_captcha_on_client_ip();
                $email = get_request('email');
                $key = $this->new_key(static::is_admin(), $email);
                $message = '<html><body>
	<p>Для продолжения регистрации, нажмите <a href="http://' . $_SERVER['SERVER_NAME'] . $_SERVER['PHP_SELF'] . '?authorization=key_validate&key=' . $key . '">эту ссылку</a></p>
	 </body></html>';
                $send_html_email_result = send_html_email($email, 'Регистация на сайте ' . $_SERVER['SERVER_NAME'], $message);
                if($send_html_email_result == 'ok')
                    $data_base64 .= '<p style="color:green;">На адрес ' . get_request('email') . ' отпралено писмо с сылкой для продолжения регистрации.</p>';
                else {
                    $this->remove_key($key);
                    $data_base64 .= '<p style="color:red;">Ошибка отправки сообщения на адрес ' . get_request('email') . ':' . $send_html_email_result . '</p>';
                }
            }
        }

        $data_base64 .= '</div>';
        $data_base64 = base64_encode($data_base64);
        return '<script type="text/javascript">sws_login_data = "' . $data_base64 . '"</script>';
    }

    function reg_new($once_reg = false, $key = null)
    {
        $out = "";
        if($once_reg)
            $out .= "<script type='text/javascript'>
window.location.hash = '#login';
</script>";
        $data_base64 = '<div class="login_form" style="display:none;">';
        $result = null;
        if(!$once_reg)
            $result = $this->get_key_inf($key);
        if(!is_null($result) or $once_reg) {
            $permissions_admin = $once_reg ? true : boolval($result[0]['admin']);
            $email = $result[0]['email'];
            $email = (is_null($email)) ? "" : $email;
            $check_password = false;
            $check_login = false;
            $form = true;
            $check_error = false;
            $form_inputs = " 
	<form  method=\"post\">
		<table>
			<tr>
				<td>Логин:</td>
				<td><input type=\"text\" name=\"login_reg\" /></td>
			</tr>
			<tr>
				<td>Пароль:</td>
				<td><input type=\"password\" name=\"password_reg[]\" /></td></tr>
			<tr>
			<td>Повторный пароль:</td>
				<td><input type=\"password\" name=\"password_reg[]\" /></td>
			</tr>
			<tr>
				<td>Сотовый телефон:</td>
				<td><input type='tel' placeholder='79112223344' pattern='^7[0-9]{10}$' name=\"phone_reg\" /></td>
			</tr>
			<tr>
				<td><input type=\"submit\" value=\"Зарегистрироваться\" /></td>
			</tr>
		</table>
	</form>";
            if(is_get("login_reg") and is_get("password_reg")) {
                $check_error = true;
                if(get_request("login_reg") !== "" and get_request("password_reg")[0] !== "" and get_request("password_reg")[1] !== "") {
                    $check_login = true;
                    if(get_request("password_reg")[0] == get_request("password_reg")[1]) {
                        $check_password = true;
                        $form = false;
                    }
                }
            }
            if($form) {
                if($check_error) {
                    if(!$check_login) {
                        $data_base64 .= "<p style=\"color:#F00;\">Одно из полей было пустым...</p>";
                    }
                    if(!$check_password and $check_login) {
                        $data_base64 .= "<p style=\"color:#F00;\"> Введённые пароли не совпадают...</p>";
                    }
                } else {
                    $data_base64 .= "<h1>Регистрация администратора</h1>";
                }

                $data_base64 .= $form_inputs;
            } else {

                // обрабатывае пришедшие данные функцией mysql_real_escape_string перед вставкой в таблицу БД

                $login = get_request('login_reg');
                $password = get_request('password_reg')[0];
                $phone = null;
                if(is_get("phone_reg"))
                    $phone = get_request('phone_reg');

                // проверяем на наличие ошибок (например, длина логина и пароля)

                $error = false;
                $errort = '';

                if(strlen($login) < 2) {
                    $error = true;
                    $errort .= ' <p style=\"color:#F00;\"> Длина логина должна быть не менее 2х символов.</p><br />';
                }
                if(strlen($password) < 6) {
                    $error = true;
                    $errort .= ' <p style=\"color:#F00;\"> Длина пароля должна быть не менее 6 символов.</p><br />';
                }

                // проверяем, если юзер в таблице с таким же логином
                $db = $this->db;
                $login = xss_filter($login);

                if($db->get_count((new qdbm\where())->equally('login', $login)) != 0) {
                    $error = true;
                    $errort .= ' <p style=\"color:#F00;\">Пользователь с таким логином уже существует в базе данных, введите другой.</p><br />';
                }

                // если ошибок нет, то добавляем юзаре в таблицу

                if(!$error) {
                    $this->user_add($key, $login, $password, $permissions_admin ? static::$roles['admin'] : static::$roles['user']);
                    $data_base64 .= '<h4>Поздравляем, Вы успешно зарегистрированы!</h4>';
                    if($once_reg)
                        redirect('?authorization=login&login=' . $login . '&password=' . $password);
                } else {
                    $data_base64 .= $errort;
                    $data_base64 .= $form_inputs;
                }
            }
        } else {
            $data_base64 .= "Ключ валидации не верный";
        }
        $data_base64 .= '</div>';
        $data_base64 = base64_encode($data_base64);
        $out .= '<script type="text/javascript">sws_login_data = "' . $data_base64 . '"</script>';
        return $out;
    }


    function notify_contacts_test($sms_phone, $email, $sms_ru_api_id = null, $sipnet_ru_id = null, $sipnet_ru_password = null)
    {
        if(!static::is_admin()) {
            return 'Ошибка доступа';

        }
        $message = '<html><body><p>Тест</p></body></html>';
        $send_html_email_result = send_html_email($email, 'Тестовое оповещение на сайте ' . $_SERVER['SERVER_NAME'], $message);
        $notify_site_title = get_settings('notify_site_title', 'global');
        $out = "";
        if($sms_phone and $sipnet_ru_id and $sipnet_ru_password)
            notify::create_call_job("Здравствуйте! Вас приветствует автоматизированная система оповещений на сайте $notify_site_title . Хотим вам сообщить следующее: Тестовое голосовое оповещение", $sipnet_ru_id, $sipnet_ru_password, $sms_phone);
        if($send_html_email_result == 'ok') {
            if(!sms::send($sms_phone, 'Тестовое оповещение, подробности отправлены на ' . $email, $sms_ru_api_id)) {
                $out .= 'Ошибка отправки сообщения на телефон :' . sms::get_last_error_mes();
            } else {
                $out .= 'Сообщения отправлены, ждите получения';
            }
        } else {
            $out .= 'Ошибка отправки сообщения на почту :' . $send_html_email_result;
        }
        return $out;
    }

    function authorization($login, $password, $vers)
    {
        global $global_settings;
        $as_obj = $this->as_obj;
        if($as_obj->get_attempts("login") > $global_settings['max_login_attempts'] and !anti_spam::check_captcha()) {
            redirect('?captcha_show' . remove_param_in_query_string($_SERVER['QUERY_STRING'], array('authorization', 'login', 'password', 'captcha_show')) . '#captcha_error');
            exit;
        }
        $as_obj->attempts_plus("login");
        $text_to_check_login = substr($login, 0, 50);
        $login = xss_filter($text_to_check_login);
        $db = $this->db;
        $result = $db->get_rows(new qdbm\select_q(null, (new qdbm\where())->equally('login', $login)));
        if($result != null) {
            $salt = $result[0]['salt'];
            $text_to_check_password = substr($password, 0, 50);
            $password = md5(md5($text_to_check_password) . $salt);
            if($result[0]['password'] == $password) {
                $_SESSION['user_id'] = $result[0]['id'];
                $_SESSION['ver'] = $vers;
                $_SESSION['role'] = $result[0]['role'];
                $_SESSION['login'] = $result[0]['login'];
                $as_obj->reset_attempts("login");
                $redirect = get_request('redirect', false);
                if(empty($redirect))
                    $redirect = get_settings('after_auth_redirect');
                if(!empty($redirect))
                    redirect("", $redirect);
                else
                    redirect('?' . remove_param_in_query_string($_SERVER['QUERY_STRING'], array('authorization', 'login', 'password', 'captcha_show', 'redirect')));
                exit;
            } else {
                redirect(remove_param_in_query_string($_SERVER['QUERY_STRING'], array('authorization', 'login', 'password', 'captcha_show', 'redirect')) . '#login_error');
                exit;
            }
        } else {
            redirect(remove_param_in_query_string($_SERVER['QUERY_STRING'], array('authorization', 'login', 'password', 'captcha_show', 'redirect')) . '#login_error');
            exit;
        }
    }

    function deauthorization()
    {
        unset($_SESSION['username']);
        unset($_SESSION['ver']);
        session_destroy();
        redirect(remove_param_in_query_string(get_query_string(), array('authorization')));
        exit;
    }

    function _edit_password($login, $password, $new_password, $new_password_check)
    {
        if(!static::is_admin())
            error('Ошибка доступа');
        $password = xss_filter($password);
        $new_password = xss_filter($new_password);
        $new_password_check = xss_filter($new_password_check);
        if(strlen($new_password) < 6) {
            return alert('Длина пароля должна быть не менее 6 символов.');
        }
        if($new_password != $new_password_check) {
            return alert('Пароли не совпадают.');
        }
        $login = xss_filter($login);

        $db = $this->db;
        $result = $this->get_user($login, static::$roles['admin']);
        $out = "";
        if($result != null) {
            $salt = $result['salt'];
            $text_to_check_password = substr($password, 0, 50);
            $password = md5(md5($text_to_check_password) . $salt);
            if($result['password'] == $password) {
                $newid = $result['id'];
                $salt = $this->GenerateSalt();
                $hashed_password = md5(md5($new_password) . $salt);
                $rec = [
                    'password' => $hashed_password,
                    'salt' => $salt
                ];
                $db->insert($rec, $newid);
                $out .= alert('Пароль изменён');
                $mes = "Пароль на сайте " . $_SERVER['SERVER_NAME'] . " был изменен";
                sms::send($result['phone'], $mes, $result['sms_ru_api_id']);
                //                if(database::check_db_name("exim_db")) {
                //                    database::set_db_name("exim_db");
                //                    database::set_db_table("accounts");
                //                    database::insert_db('password', $new_password, null, null, (new qdbm\qdbm_where())->equally('login', 'support'));
                //                    database::set_db_name($mysqli["db_name"]);
                //                }
            } else
                $out .= alert('Неправильный пароль');
        } else
            $out .= alert('Неизвестная ошибка');
        return $out;
    }


    function get_main_html()
    {
        $as_obj = $this->as_obj;
        if(is_ajax())
            return "";

        $global_settings = get_settings(null, 'global');
        $data_base64 = '';
        $out = "";
        if(static::is_admin()) {
            $arr = $this->get_user($_SESSION['login']);
            $email = $arr['email'];
            $phone = $arr['phone'];
            $api_id = $arr['sms_ru_api_id'];
            $sip_id = $arr['sipnet_ru_id'];
            $sip_password = $arr['sipnet_ru_password'];
            $call_hs = $arr['call_hour_start'];
            $call_he = $arr['call_hour_end'];
            $n_obj = new notify();
            $notify_res = $n_obj->get();
            $notify_len = !empty($notify_res) ? count($notify_res) : 0;
            if(is_null($notify_len) or $notify_len == 0)
                $notify_len = 0;
            $notify_html = "";
            if(!is_null($notify_res))
                foreach ($notify_res as $notify)
                    $notify_html .= "<tr><td>" . $notify['title'] . " <a href='" . $notify['href'] . "'>" . $notify['href_but_name'] . "</a></td></tr>";
            else
                $notify_html .= "<tr><td>Уведомлений пока нет</td></tr>";

            $select_hs_gen = "";
            for ($i = 0; $i <= 23; $i++) {
                $select_hs_gen .= "<option " . (($call_hs == $i) ? 'selected' : '') . ">$i</option>";
            }

            $select_he_gen = "";
            for ($i = 0; $i <= 23; $i++) {
                $select_he_gen .= "<option " . (($call_he == $i) ? 'selected' : '') . ">$i</option>";
            }

            $select_hs_gen = "<select name='call_hour_start'>$select_hs_gen</select>";
            $select_he_gen = "<select name='call_hour_end'>$select_he_gen</select>";

            $out .= '<script type="text/javascript">is_admin=true; var notify_len=' . $notify_len . ';</script>';
            $data_base64 .= '
<div class="password_edit" style="display: none; line-height: normal; font-size: initial;">
<h3>Смена пароля</h3><form method="post" action="' . htmlspecialchars($_SERVER['REQUEST_URI'], ENT_NOQUOTES) . '">
<table style="width: auto;">
<tr>
<td>Текущий пароль:</td>
<td><input type="password" name="password" /></td>
</tr>
<tr>
<td>Новый пароль:</td>
<td><input type="password" name="new_password" /></td>
</tr>
<tr>
<td>Повторите новый пароль:</td>
<td><input type="password" name="new_password_check" /></td>
</tr>
<tr>
<td></td>
<td><input type="submit" value="ОК" /></td>
</tr>
</table>
<input type="hidden" name="authorization" value="password_edit">
</form>
</div>
<div class="notify_show" style="display: none;">
<h3>Центр уведомлений</h3>
<table style="width: auto;">
' . $notify_html . '
</table>
</div>

<div class="notify_set" style="display: none; line-height: normal; font-size: initial;">
<h3>Настройки уведомлений</h3>
 <p>Укажите контактные данные, на которые будут высылаться оповещения об изменениях на сайте</p>
<form method="post" action="#">
<table style="width: auto;">
<td>Электронная почта:</td>
<td><input type="email" required name="email" value="' . $email . '" pattern="^[^.@]+@[^.@]+\.[^.@]+$"/></td>
</tr>
<tr>
<tr>
<td>Сотовый телефон:</td>
<td><input type="tel" pattern="^\+7[0-9]{10}$" name="phone" value="' . $phone . '" placeholder="+79112223344" /></td>
</tr>
<tr>
<tr>
<td>Ваш <a target="_blank" href="http://sms.ru">SMS.ru</a> api_id:</td>
<td><input type="text" name="sms_ru_api_id" value="' . $api_id . '" /></td>
</tr>
<tr>
<td>Ваш SIP ID на <a target="_blank" href="https://www.sipnet.ru/">www.sipnet.ru</a> </td>
<td><input type="text" name="sipnet_ru_id" value="' . $sip_id . '" /> </td>
</tr>
<tr>
<td>Ваш SIP пароль на <a target="_blank" href="https://www.sipnet.ru/">www.sipnet.ru</a> </td>
<td><input type="password" name="sipnet_ru_password" value="' . $sip_password . '" /></td>
</tr>
<tr>
<tr>
<td>Время для голосовых оповещений </td>
<td>&nbsp;с ' . $select_hs_gen . ' до ' . $select_he_gen . ' часов</td>
</tr>
<tr>
<td><input class="notify_contacts_test" name="notify_contacts_test" type="submit" value="Тест" /></td>
<td><input type="submit" value="Сохранить" /></td>
</tr>
</table>
<input type="hidden" name="authorization" value="notify_contacts_save">
</form>
</div>

<div class="account_edit" style="display: none; line-height: normal; font-size: initial;">
<h3>Аккаунт</h3>
<table style="width: auto;">
<tr>
<td><a href="#logout">Выход из аккаунта</a></td>
</tr>
<tr>
<td><a href="#notify_show">Центр уведомлений ' . ($notify_len ? "<span style='color: red;'>$notify_len</span>" : "") . '</a></td>
</tr>
<tr>
<td><a href="#notify_set">Настройки уведомлений</a></td>
</tr>
<tr>
<td><a href="#password_edit">Сменить пароль</a></td>
</tr>
<tr>
</tr>
' . static::$custom_popup_links . '
</table>
</div>
';
        } else {
            $data_base64 .= '
<div class="login_form" style="display: none;">
<h3>Авторизация</h3><form method="post" action="' . htmlspecialchars($_SERVER['REQUEST_URI'], ENT_NOQUOTES) . '">
<table>
<tr>
<td>Логин:</td>
<td> <input type="hidden" name="authorization" value="login"><input type="text" name="login" /></td>
</tr>
<tr>
<td>Пароль:</td>
<td><input type="password" name="password" /></td>
</tr>
';
            if(is_get('captcha_show') && $as_obj->get_attempts("login") > $global_settings['max_login_attempts'])
                $data_base64 .= '<tr><td colspan="2">' . anti_spam::get_captcha_html() . '</td></tr>';
            $data_base64 .= '<tr>
<td colspan="2" style="text-align: center; padding-top: 8px;"><input type="submit" value="Войти" /></td>
</tr></table>
</form>
</div>
';
        };
        $data_base64 = base64_encode($data_base64);
        if(!to_boolean(get_request('disable_login_data_html')))
            $out .= '<script type="text/javascript">sws_login_data = "' . $data_base64 . '"</script>';
        return $out;
    }
}