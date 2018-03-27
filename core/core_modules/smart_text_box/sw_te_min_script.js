$(document).ready(function () {
    var iframe_video_size_update_filter = null;
    var iframe_video_size_update = function (force) {
        if (is_admin && !force && typeof SW_TE === 'undefined')
            return false;
        clearTimeout(iframe_video_size_update_filter);
        iframe_video_size_update_filter = setTimeout(function () {
            var video_objs = $('.SW_TE_iframe_video');
            var video_objs_size = video_objs.length;
            for (var i2 = 0; i2 < video_objs_size; i2++) {
                var iframe_video = video_objs.eq(i2).children('iframe');
                var width = iframe_video.width();
                var new_height = width / 16 * 9;
                iframe_video.height(new_height);
            }
        }, 500);
    };
    if (!is_admin && typeof SW_TE !== 'undefined') {
        $(window).resize(iframe_video_size_update);
        $(document).scroll(iframe_video_size_update);
        iframe_video_size_update();
    }
});