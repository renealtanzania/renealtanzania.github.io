
<?php
function Redirect($url, $permanent = false)
{
header( 'Location:  ' . $url , true, $permanent ? 301 : 302);
exit();
}
Redirect('/status/index.html', false);



