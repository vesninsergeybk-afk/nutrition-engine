<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}

putenv('NUTRITION_GEMINI_ENABLED=1');
putenv('GEMINI_API_KEY=env-primary-test-key');
putenv('GEMINI_API_KEY_BACKUP=env-backup-test-key');
putenv('GEMINI_API_KEYS=["env-pool-test-key","env-backup-test-key"]');
define('NUTRITION_GEMINI_TEST_MODE',true);
require dirname(__DIR__).'/api/gemini.php';

$env=load_api_keys();
$checks=[];
$checks['environment_primary']=($env[0]['key']??'')==='env-primary-test-key';
$checks['environment_backup']=in_array('env-backup-test-key',array_column($env,'key'),true);
$checks['environment_pool']=in_array('env-pool-test-key',array_column($env,'key'),true);
$checks['environment_deduplicates']=count(array_filter(array_column($env,'key'),static fn($x)=>$x==='env-backup-test-key'))===1;

putenv('GEMINI_API_KEY');putenv('GEMINI_API_KEY_BACKUP');putenv('GEMINI_API_KEYS');
$tmp=tempnam(sys_get_temp_dir(),'hf28-secret-');
if($tmp===false)throw new RuntimeException('Cannot create temporary secret file.');
file_put_contents($tmp,"<?php\nif (!defined('NUTRITION_GEMINI_INTERNAL')) { http_response_code(404); exit; }\nreturn ['primary'=>'file-primary-test-key','backup'=>['file-backup-test-key']];\n");
chmod($tmp,0600);
putenv('GEMINI_SECRET_FILE='.$tmp);
$file=load_api_keys();
$checks['external_file_primary']=($file[0]['key']??'')==='file-primary-test-key';
$checks['external_file_backup']=in_array('file-backup-test-key',array_column($file,'key'),true);
$checks['external_file_permissions']=(fileperms($tmp)&0777)===0600;
@unlink($tmp);putenv('GEMINI_SECRET_FILE');

$packaged=load_api_keys();
$packagedValues=array_column($packaged,'key');
$checks['packaged_primary_present']=count($packagedValues)>=1 && strlen((string)$packagedValues[0])>=20;
$checks['packaged_backup_present']=count($packagedValues)>=2 && strlen((string)$packagedValues[1])>=20;
$checks['packaged_keys_unique']=count(array_unique($packagedValues))===count($packagedValues);
$checks['packaged_slots_named']=($packaged[0]['slot']??'')==='primary' && str_starts_with((string)($packaged[1]['slot']??''),'backup');

foreach($checks as $name=>$ok)if(!$ok)throw new RuntimeException('Assertion failed: '.$name);
echo json_encode(['ok'=>true,'assertions'=>count($checks),'checks'=>$checks],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_PRETTY_PRINT)."\n";
