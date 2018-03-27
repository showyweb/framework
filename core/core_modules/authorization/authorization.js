

var is_admin = false;
$(document).ready(function () {
    var browser = SW_BS.browser;
    if (typeof sws_login_data !== "undefined")
        var login_html = Base64.decode(sws_login_data);
    function handlePage() {
        // if ($.cookie('jivo_opened') == "open") {
        //     $.cookie("jivo_opened", "", {path: "/"});
        //     window.location.reload();
        // }

        var hash = window.location.hash;
        if (hash == "")
            return;
        var login_error = (hash == "#login_error") ? true : false;
        var captcha_error = (hash == "#captcha_error") ? true : false;
        hash = hash.substr(1);
        var hash_arr = hash.split('#');
        hash = hash_arr[0];

        //var callback = (hash_arr.length==1)?"":hash_arr[1];
        switch (hash) {
            case 'login':
            case 'login_error':
            case 'captcha_error':
                if (is_admin)
                    return;
                smart_text_box.show_text_window(login_html, function () {
                    $(".login_form").removeAttr('style');
                    $('.text_window>div>div>div').css({'width': 'auto', 'max-width': '330px'});
                    $('.text_window input[type=submit]').click(function () {
                        $("#login_form").submit();
                    });
                    if (login_error) {
                        $(".login_form").before('<h3 style="color:red;">Пользователь с таким логином и паролем не найден.</h3>');
                    }
                    if (captcha_error) {
                        $(".login_form").before('<h3 style="color:red;">Не правильно введены символы с картинки</h3>');
                    }
                    $('.text_window input[type=text]').first().focus();
                });
                break;
            case 'account_edit':
            case 'notify_show':
            case 'notify_set':
            case 'password_edit':
                window.location.hash = "";
                smart_text_box.show_text_window(login_html, function (index) {
                    var cur_tw = $('.text_window').eq(index);
                    // console.log(index);
                    cur_tw.find("." + hash).removeAttr('style');
                    setTimeout(function () {

                        $('.notify_contacts_test').eq(1).click(function (ev) {
                            ev.preventDefault();
                            browser.disable_hover();
                            post_ajax('authorization', {
                                'authorization': 'notify_contacts_test',
                                'phone': cur_tw.find('input[name=phone]').val(),
                                'email': cur_tw.find('input[name=email]').val(),
                                'sms_ru_api_id': cur_tw.find('input[name=sms_ru_api_id]').val(),
                                'sipnet_ru_id': cur_tw.find('input[name=sipnet_ru_id]').val(),
                                'sipnet_ru_password': cur_tw.find('input[name=sipnet_ru_password]').val()
                            }, function (data) {
                                browser.enable_hover();
                                alert(data);
                            }, true);
                            return false;
                        });
                    }, 100);
                    //$('#text_window input[type=submit]').click(function () {
                    //    $(this).parents('form').submit();
                    //});
                });
                break;
            case 'logout':
                window.location.hash = "";
                window.location.search = ((window.location.search == "") ? "?" : window.location.search + "&") + "authorization=exit_user";
                break;
        }
    }

    window.onpopstate = handlePage;
    if (browser.msie)
        window.onhashchange = handlePage;
    handlePage();

    if (is_admin)
        setInterval(function () {
            get_ajax('authorization', {}, function () {
            });
        }, 1000 * 60);
});