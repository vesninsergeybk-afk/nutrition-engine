<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}

$guardDir = sys_get_temp_dir().'/nutrition-p04-test-'.getmypid();
@mkdir($guardDir,0700,true);
putenv('NUTRITION_GEMINI_GUARD_DIR='.$guardDir);
putenv('NUTRITION_GEMINI_GUARD_LOG=1');
putenv('NUTRITION_GEMINI_ENABLED=1');
define('NUTRITION_GEMINI_TEST_MODE', true);
$_SERVER['REMOTE_ADDR']='198.51.100.10';
require dirname(__DIR__).'/api/gemini.php';

$cases=0;$results=[];
function t(string $name, callable $fn): void { global $cases,$results; try{$fn();$cases++;$results[]=['name'=>$name,'ok'=>true];}catch(Throwable $e){$results[]=['name'=>$name,'ok'=>false,'error'=>$e->getMessage()];throw $e;} }
function reset_guard(): void { global $guardDir; unset($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE'],$GLOBALS['NUTRITION_GEMINI_INTEGRITY_LOCKDOWN']); putenv('NUTRITION_GEMINI_INTEGRITY_FLAG_FILE'); if(is_file(dirname(__DIR__).'/api/integrity-failed.flag'))@unlink(dirname(__DIR__).'/api/integrity-failed.flag'); foreach(glob($guardDir.'/*')?:[] as $f){if(is_dir($f))@rmdir($f);else @unlink($f);} putenv('NUTRITION_GEMINI_ENABLED=1'); putenv('NUTRITION_GEMINI_EXPLAIN_CLIENT_MINUTE=100');putenv('NUTRITION_GEMINI_EXPLAIN_SUBNET_MINUTE=100');putenv('NUTRITION_GEMINI_EXPLAIN_GLOBAL_MINUTE=100');putenv('NUTRITION_GEMINI_MEDIA_CLIENT_MINUTE=100');putenv('NUTRITION_GEMINI_MEDIA_SUBNET_MINUTE=100');putenv('NUTRITION_GEMINI_MEDIA_GLOBAL_MINUTE=100');putenv('NUTRITION_GEMINI_PLANNER_CLIENT_MINUTE=100');putenv('NUTRITION_GEMINI_PLANNER_SUBNET_MINUTE=100');putenv('NUTRITION_GEMINI_PLANNER_GLOBAL_MINUTE=100');putenv('NUTRITION_GEMINI_PLANNER_CLIENT_10M=100');putenv('NUTRITION_GEMINI_PLANNER_CLIENT_HOUR=100');putenv('NUTRITION_GEMINI_PLANNER_CLIENT_DAY=100');putenv('NUTRITION_GEMINI_PLANNER_SUBNET_10M=100');putenv('NUTRITION_GEMINI_PLANNER_SUBNET_HOUR=100');putenv('NUTRITION_GEMINI_PLANNER_GLOBAL_10M=100');putenv('NUTRITION_GEMINI_PLANNER_GLOBAL_HOUR=100');putenv('NUTRITION_GEMINI_PLANNER_GLOBAL_DAY=100');putenv('NUTRITION_GEMINI_GLOBAL_CONCURRENCY=10');putenv('NUTRITION_GEMINI_CLIENT_CONCURRENCY=3');putenv('NUTRITION_GEMINI_TOKENS_PER_MINUTE=1000000');putenv('NUTRITION_GEMINI_TOKENS_PER_HOUR=1000000');putenv('NUTRITION_GEMINI_TOKENS_PER_DAY=5000000');putenv('NUTRITION_GEMINI_EXPLAIN_TOKENS_PER_MINUTE=1000000');putenv('NUTRITION_GEMINI_EXPLAIN_TOKENS_PER_HOUR=1000000');putenv('NUTRITION_GEMINI_EXPLAIN_TOKENS_PER_DAY=5000000');putenv('NUTRITION_GEMINI_PLANNER_TOKENS_PER_MINUTE=1000000');putenv('NUTRITION_GEMINI_PLANNER_TOKENS_PER_HOUR=1000000');putenv('NUTRITION_GEMINI_PLANNER_TOKENS_PER_DAY=5000000');putenv('NUTRITION_GEMINI_MEDIA_TOKENS_PER_MINUTE=1000000');putenv('NUTRITION_GEMINI_MEDIA_TOKENS_PER_HOUR=1000000');putenv('NUTRITION_GEMINI_MEDIA_TOKENS_PER_DAY=5000000');putenv('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_MINUTE=100');putenv('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_10M=100');putenv('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_HOUR=100');putenv('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_DAY=100');putenv('NUTRITION_GEMINI_PLANNER_MAX_PROVIDER_ATTEMPTS=4');putenv('NUTRITION_GEMINI_CIRCUIT_FAILURES=5');putenv('NUTRITION_GEMINI_CIRCUIT_WINDOW_SECONDS=300');putenv('NUTRITION_GEMINI_CIRCUIT_OPEN_SECONDS=120');putenv('NUTRITION_GEMINI_GUARD_STATE_MAX_BYTES=8388608');putenv('NUTRITION_GEMINI_GUARD_LOG_MAX_BYTES=5242880');putenv('NUTRITION_GEMINI_GUARD_LOG_RETENTION_DAYS=14');putenv('NUTRITION_GEMINI_INPUT_MICRO_USD_PER_M_TOKENS=1500000');putenv('NUTRITION_GEMINI_OUTPUT_MICRO_USD_PER_M_TOKENS=9000000');putenv('NUTRITION_GEMINI_COST_MICRO_USD_PER_MINUTE=1000000000');putenv('NUTRITION_GEMINI_COST_MICRO_USD_PER_HOUR=1000000000');putenv('NUTRITION_GEMINI_COST_MICRO_USD_PER_DAY=1000000000');putenv('NUTRITION_GEMINI_EXPLAIN_COST_MICRO_USD_PER_DAY=1000000000');putenv('NUTRITION_GEMINI_PLANNER_COST_MICRO_USD_PER_DAY=1000000000');putenv('NUTRITION_GEMINI_MEDIA_COST_MICRO_USD_PER_DAY=1000000000');$_SERVER['REMOTE_ADDR']='198.51.100.10'; unset($_SERVER['HTTP_X_FORWARDED_FOR'],$_SERVER['HTTP_X_REAL_IP'],$_SERVER['HTTP_CF_CONNECTING_IP']); putenv('NUTRITION_GEMINI_TRUST_PROXY=0'); putenv('NUTRITION_GEMINI_TRUSTED_PROXIES'); putenv('NUTRITION_GEMINI_TRUSTED_CLIENT_IP_HEADER'); putenv('NUTRITION_GEMINI_PRICING_REVIEWED_UNTIL'); }
function expect_guard_error(callable $fn,string $code,int $status=429): GeminiApiException { try{$fn();}catch(GeminiApiException $e){if($e->errorCode!==$code||$e->httpStatus!==$status)throw new RuntimeException("expected $code/$status, got {$e->errorCode}/{$e->httpStatus}");return $e;}throw new RuntimeException('expected guard error'); }
function state_now(): array { return nutrition_guard_with_state(static fn(array &$s):array=>$s,false); }

reset_guard();
t('kill switch env',function(){putenv('NUTRITION_GEMINI_ENABLED=0');expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'ai_kill_switch_env',503);putenv('NUTRITION_GEMINI_ENABLED=1');});

reset_guard();
t('expired or invalid pricing review date fails closed',function(){
    putenv('NUTRITION_GEMINI_PRICING_REVIEWED_UNTIL=2020-01-01');expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_pricing_review_required',503);
    putenv('NUTRITION_GEMINI_PRICING_REVIEWED_UNTIL=2026-02-31');expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_pricing_review_invalid',503);
    putenv('NUTRITION_GEMINI_PRICING_REVIEWED_UNTIL=2099-12-31');nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);
});

reset_guard();
t('client rolling limit survives session changes',function(){putenv('NUTRITION_GEMINI_PLANNER_CLIENT_10M=2');for($i=0;$i<2;$i++){nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);}expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_client_10m');});

reset_guard();
t('subnet bucket spans distinct client IPs',function(){putenv('NUTRITION_GEMINI_PLANNER_SUBNET_10M=2');foreach(['198.51.100.10','198.51.100.11'] as $ip){$_SERVER['REMOTE_ADDR']=$ip;nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);}$_SERVER['REMOTE_ADDR']='198.51.100.12';expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_subnet_10m');});

reset_guard();
t('global limit spans distinct subnets',function(){putenv('NUTRITION_GEMINI_PLANNER_GLOBAL_10M=2');foreach(['198.51.100.10','203.0.113.10'] as $ip){$_SERVER['REMOTE_ADDR']=$ip;nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);}$_SERVER['REMOTE_ADDR']='192.0.2.10';expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_global_10m');});

reset_guard();
t('client concurrency enforced',function(){putenv('NUTRITION_GEMINI_CLIENT_CONCURRENCY=1');nutrition_guard_begin('planner',1000);expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_client_concurrency');nutrition_guard_finish(true);});

reset_guard();
t('global concurrency enforced',function(){putenv('NUTRITION_GEMINI_GLOBAL_CONCURRENCY=1');nutrition_guard_begin('planner',1000);$first=$GLOBALS['NUTRITION_GEMINI_GUARD_LEASE'];unset($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']);$_SERVER['REMOTE_ADDR']='203.0.113.7';expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_global_concurrency');$GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']=$first;nutrition_guard_finish(true);});

reset_guard();
t('provider call cannot start without a guard lease',function(){unset($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']);expect_guard_error(fn()=>nutrition_guard_before_provider_attempt('model-a'),'guard_lease_missing',503);});

reset_guard();
t('provider usage without a lease triggers integrity lockdown',function(){unset($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']);expect_guard_error(fn()=>nutrition_guard_record_usage(['totalTokenCount'=>100]),'guard_usage_accounting_failed',503);$paths=nutrition_guard_paths();if(!is_file($paths['integrity']))throw new RuntimeException('integrity marker missing');});

reset_guard();
t('integrity lockdown persists through configured emergency flag when primary marker fails',function(){
    $paths=nutrition_guard_paths();@mkdir($paths['integrity'],0700);$emergency=dirname($paths['integrity']).'/emergency-integrity.flag';putenv('NUTRITION_GEMINI_INTEGRITY_FLAG_FILE='.$emergency);
    nutrition_guard_mark_integrity_failure('forced_primary_marker_failure');
    if(!is_file($emergency))throw new RuntimeException('emergency integrity marker missing');
    $kill=nutrition_guard_kill_switch();if(empty($kill['disabled'])||($kill['code']??'')!=='guard_integrity_lockdown')throw new RuntimeException('emergency integrity marker not enforced');
    @unlink($emergency);@rmdir($paths['integrity']);unset($GLOBALS['NUTRITION_GEMINI_INTEGRITY_LOCKDOWN']);putenv('NUTRITION_GEMINI_INTEGRITY_FLAG_FILE');
});

reset_guard();
t('provider attempts capped per operation',function(){putenv('NUTRITION_GEMINI_PLANNER_MAX_PROVIDER_ATTEMPTS=2');nutrition_guard_begin('planner',1000);nutrition_guard_before_provider_attempt('model-a');nutrition_guard_release_attempt_reservation('test');nutrition_guard_before_provider_attempt('model-b');nutrition_guard_release_attempt_reservation('test');expect_guard_error(fn()=>nutrition_guard_before_provider_attempt('model-c'),'guard_operation_attempt_budget');nutrition_guard_finish(false,'guard_operation_attempt_budget',30,true);});

reset_guard();
t('provider attempt global budget',function(){putenv('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_10M=5');putenv('NUTRITION_GEMINI_PLANNER_MAX_PROVIDER_ATTEMPTS=8');nutrition_guard_begin('planner',1000);for($i=0;$i<5;$i++){nutrition_guard_before_provider_attempt('model-'.$i);nutrition_guard_release_attempt_reservation('test');}expect_guard_error(fn()=>nutrition_guard_before_provider_attempt('model-x'),'guard_provider_attempts_10m');nutrition_guard_finish(false,'guard_provider_attempts_10m',30,true);});

reset_guard();
t('token reservation prevents concurrent overshoot',function(){putenv('NUTRITION_GEMINI_TOKENS_PER_HOUR=10000');putenv('NUTRITION_GEMINI_GLOBAL_CONCURRENCY=5');nutrition_guard_begin('planner',8000);$first=$GLOBALS['NUTRITION_GEMINI_GUARD_LEASE'];unset($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']);$_SERVER['REMOTE_ADDR']='203.0.113.8';$e=expect_guard_error(fn()=>nutrition_guard_begin('planner',3000),'guard_tokens_hour');if($e->retryAfterSeconds<100)throw new RuntimeException('reservation retry-after too short');$GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']=$first;nutrition_guard_finish(true);});

reset_guard();
t('usage metadata is accounted without payload storage',function(){nutrition_guard_begin('planner',5000);nutrition_guard_before_provider_attempt('model-a');nutrition_guard_record_usage(['promptTokenCount'=>900,'candidatesTokenCount'=>300,'thoughtsTokenCount'=>100,'totalTokenCount'=>1300]);nutrition_guard_finish(true);$state=state_now();if(count($state['tokens'])!==1||($state['tokens'][0]['total']??0)!==1300)throw new RuntimeException('usage not accounted');$raw=json_encode($state);if(str_contains($raw,'198.51.100.10'))throw new RuntimeException('raw IP stored');});

reset_guard();
t('media token budget is isolated from planner token budget',function(){putenv('NUTRITION_GEMINI_MEDIA_TOKENS_PER_HOUR=10000');nutrition_guard_begin('media',8000);nutrition_guard_before_provider_attempt('model-a');nutrition_guard_record_usage(['totalTokenCount'=>8000]);nutrition_guard_finish(true);expect_guard_error(fn()=>nutrition_guard_begin('media',3000),'guard_media_tokens_hour');nutrition_guard_begin('planner',3000);nutrition_guard_finish(true);});

reset_guard();
t('missing provider usage metadata is charged conservatively from reservation',function(){nutrition_guard_begin('planner',4200);nutrition_guard_before_provider_attempt('model-a');nutrition_guard_record_usage(null);nutrition_guard_finish(true);$state=state_now();$row=$state['tokens'][0]??[];if(($row['total']??0)!==4200||empty($row['estimated']))throw new RuntimeException('missing usage was not conservatively charged');});

reset_guard();
t('rate-limit failure opens provider backoff',function(){nutrition_guard_begin('planner',1000);nutrition_guard_finish(false,'rate_limit_requests',90,true);$e=expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_provider_backoff');if($e->retryAfterSeconds<80)throw new RuntimeException('backoff too short');});

reset_guard();
t('repeated retryable failures open circuit',function(){for($i=0;$i<5;$i++){nutrition_guard_begin('planner',1000);nutrition_guard_finish(false,'temporary_service_error',3,true);}expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_circuit_open');});

reset_guard();
t('valid backup recovers corrupt primary',function(){nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);$paths=nutrition_guard_paths();copy($paths['state'],$paths['backup']);file_put_contents($paths['state'],'{broken');nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);$state=state_now();if(!nutrition_guard_valid_state($state))throw new RuntimeException('backup recovery failed');});

reset_guard();
t('primary and backup commit the same current revision',function(){
    nutrition_guard_begin('planner',1000);nutrition_guard_before_provider_attempt('model-a');nutrition_guard_record_usage(['promptTokenCount'=>100,'candidatesTokenCount'=>50,'totalTokenCount'=>150]);nutrition_guard_finish(true);
    $paths=nutrition_guard_paths();$primary=file_get_contents($paths['state']);$backup=file_get_contents($paths['backup']);if($primary!==$backup)throw new RuntimeException('redundant state copies diverged');
    $before=json_decode($backup,true);file_put_contents($paths['state'],'broken');$recovered=state_now();if(($recovered['revision']??-1)!==($before['revision']??-2)||count($recovered['costs']??[])!==1)throw new RuntimeException('latest ledger was lost during recovery');
});

reset_guard();
t('double corruption fails closed',function(){nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);$paths=nutrition_guard_paths();file_put_contents($paths['state'],'bad');file_put_contents($paths['backup'],'bad');expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_storage_unavailable',503);});

reset_guard();
t('kill switch file',function(){file_put_contents(dirname(__DIR__).'/api/gemini-disabled.flag','disabled');try{expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'ai_kill_switch_file',503);}finally{@unlink(dirname(__DIR__).'/api/gemini-disabled.flag');}});

reset_guard();
t('health is generic and available',function(){$status=nutrition_guard_public_status();if(($status['available']??false)!==true||array_key_exists('remaining',$status))throw new RuntimeException('bad public status');});

reset_guard();
t('token estimator bounded',function(){foreach([nutrition_guard_estimate_tokens('explain',10000),nutrition_guard_estimate_tokens('planner',10000),nutrition_guard_estimate_tokens('media',500,7*1024*1024,8)] as $n)if($n<500||$n>1000000)throw new RuntimeException('estimate out of bounds');});

reset_guard();
t('successful provider response clears rolling failure circuit',function(){for($i=0;$i<4;$i++){nutrition_guard_begin('planner',1000);nutrition_guard_finish(false,'temporary_service_error',3,true);}nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);nutrition_guard_begin('planner',1000);nutrition_guard_finish(false,'temporary_service_error',3,true);$state=state_now();if(count($state['failures'])!==1)throw new RuntimeException('success did not close failure circuit');});

reset_guard();
t('public health closes on provider daily attempt budget',function(){putenv('NUTRITION_GEMINI_PROVIDER_ATTEMPTS_DAY=20');nutrition_guard_with_state(function(array &$state):void{$now=time();for($i=0;$i<20;$i++)$state['attempts'][]=['ts'=>$now,'kind'=>'planner','client'=>'x','model'=>'m'];});$status=nutrition_guard_public_status();if(($status['available']??true)!==false||($status['code']??'')!=='guard_provider_attempts_day')throw new RuntimeException('daily attempt health not closed');});

reset_guard();
t('public health closes on token daily budget',function(){putenv('NUTRITION_GEMINI_TOKENS_PER_DAY=50000');nutrition_guard_with_state(function(array &$state):void{$state['tokens'][]=['ts'=>time(),'kind'=>'planner','total'=>50000];});$status=nutrition_guard_public_status();if(($status['available']??true)!==false||($status['code']??'')!=='guard_tokens_day')throw new RuntimeException('daily token health not closed');});

reset_guard();
t('forwarded IP spoof is ignored unless proxy explicitly trusted',function(){$_SERVER['REMOTE_ADDR']='198.51.100.10';$_SERVER['HTTP_X_FORWARDED_FOR']='203.0.113.99';putenv('NUTRITION_GEMINI_TRUST_PROXY=0');$first=nutrition_guard_identity();unset($_SERVER['HTTP_X_FORWARDED_FOR']);$second=nutrition_guard_identity();if($first!==$second)throw new RuntimeException('untrusted forwarded IP changed identity');});

reset_guard();
t('trusted proxy may supply validated forwarded client IP',function(){$_SERVER['REMOTE_ADDR']='192.0.2.20';$_SERVER['HTTP_X_FORWARDED_FOR']='203.0.113.99, 192.0.2.20';putenv('NUTRITION_GEMINI_TRUST_PROXY=1');putenv('NUTRITION_GEMINI_TRUSTED_PROXIES=192.0.2.20');$proxied=nutrition_guard_identity();putenv('NUTRITION_GEMINI_TRUST_PROXY=0');$_SERVER['REMOTE_ADDR']='203.0.113.99';unset($_SERVER['HTTP_X_FORWARDED_FOR']);$direct=nutrition_guard_identity();if($proxied!==$direct)throw new RuntimeException('trusted proxy client identity mismatch');});

reset_guard();
t('IPv6 subnet bucket uses a shared /56 boundary',function(){$_SERVER['REMOTE_ADDR']='2001:db8:abcd:1201::1';$a=nutrition_guard_identity();$_SERVER['REMOTE_ADDR']='2001:db8:abcd:12ff::2';$b=nutrition_guard_identity();if($a['subnet']!==$b['subnet']||$a['client']===$b['client'])throw new RuntimeException('IPv6 subnet/client hashing mismatch');});

reset_guard();
t('expired inflight lease is pruned and no longer blocks concurrency',function(){putenv('NUTRITION_GEMINI_CLIENT_CONCURRENCY=1');nutrition_guard_begin('planner',1000);$lease=$GLOBALS['NUTRITION_GEMINI_GUARD_LEASE'];nutrition_guard_with_state(function(array &$state)use($lease):void{$state['inflight'][$lease]['expires_at']=time()-1;});unset($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']);nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);});

reset_guard();
t('mocked provider integration counts attempts and usage metadata',function(){nutrition_guard_begin('planner',5000);$GLOBALS['NUTRITION_GEMINI_HTTP_MOCK']=static function():array{return ['status'=>200,'raw'=>json_encode(['candidates'=>[['content'=>['parts'=>[['text'=>'ok']]],'finishReason'=>'STOP']],'usageMetadata'=>['promptTokenCount'=>900,'candidatesTokenCount'=>200,'thoughtsTokenCount'=>50,'totalTokenCount'=>1150]],JSON_UNESCAPED_SLASHES),'headers'=>[]];};$response=post_json_to_gemini([['slot'=>'primary','key'=>'dummy-key']],['contents'=>[['role'=>'user','parts'=>[['text'=>'test']]]]],5,false);unset($GLOBALS['NUTRITION_GEMINI_HTTP_MOCK']);nutrition_guard_finish(true);if(($response['usageMetadata']['totalTokenCount']??0)!==1150)throw new RuntimeException('mock provider response invalid');$state=state_now();if(count($state['attempts'])!==1||count($state['tokens'])!==1||($state['tokens'][0]['total']??0)!==1150)throw new RuntimeException('provider integration not accounted');});

reset_guard();
t('non-success provider response with usage metadata is charged exactly once',function(){
    nutrition_guard_begin('planner',4000);$GLOBALS['NUTRITION_GEMINI_HTTP_MOCK']=static function():array{return ['status'=>503,'raw'=>json_encode(['error'=>['message'=>'temporary'],'usageMetadata'=>['promptTokenCount'=>600,'candidatesTokenCount'=>100,'thoughtsTokenCount'=>50,'totalTokenCount'=>750]],JSON_UNESCAPED_SLASHES),'headers'=>[]];};
    try{post_json_to_gemini([['slot'=>'primary','key'=>'dummy-key']],['contents'=>[['role'=>'user','parts'=>[['text'=>'test']]]]],5,false);}catch(GeminiApiException $e){if($e->errorCode!=='temporary_service_error')throw $e;}finally{unset($GLOBALS['NUTRITION_GEMINI_HTTP_MOCK']);}
    nutrition_guard_finish(false,'temporary_service_error',5,true);$state=state_now();
    if(count($state['tokens'])!==1||($state['tokens'][0]['total']??0)!==750||count($state['costs'])!==1)throw new RuntimeException('error usage was not accounted exactly once');
});

reset_guard();
t('mocked transport failure is conservatively charged before successful retry',function(){nutrition_guard_begin('planner',4000);$n=0;$GLOBALS['NUTRITION_GEMINI_HTTP_MOCK']=static function()use(&$n):array{$n++;if($n===1)return ['status'=>0,'raw'=>false,'transport_error'=>'timeout','headers'=>[]];return ['status'=>200,'raw'=>json_encode(['candidates'=>[['content'=>['parts'=>[['text'=>'ok']]],'finishReason'=>'STOP']],'usageMetadata'=>['promptTokenCount'=>700,'candidatesTokenCount'=>200,'thoughtsTokenCount'=>100,'toolUsePromptTokenCount'=>50,'totalTokenCount'=>1050]],JSON_UNESCAPED_SLASHES),'headers'=>[]];};$response=post_json_to_gemini([['slot'=>'primary','key'=>'dummy-key']],['contents'=>[['role'=>'user','parts'=>[['text'=>'test']]]]],5,true);unset($GLOBALS['NUTRITION_GEMINI_HTTP_MOCK']);nutrition_guard_finish(true);$state=state_now();if($n!==2||nutrition_guard_sum_tokens($state['tokens'],time(),3600)!==5050||count($state['attempts'])!==2)throw new RuntimeException('retry path was not fully accounted');});

reset_guard();
t('usage accounting failure creates persistent integrity lockdown',function(){nutrition_guard_begin('planner',5000);nutrition_guard_before_provider_attempt('model-a');$paths=nutrition_guard_paths();file_put_contents($paths['state'],'bad');file_put_contents($paths['backup'],'bad');expect_guard_error(fn()=>nutrition_guard_record_usage(['totalTokenCount'=>1000]),'guard_usage_accounting_failed',503);if(!is_file($paths['integrity']))throw new RuntimeException('integrity marker missing');unset($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']);expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_integrity_lockdown',503);});

reset_guard();
t('clock rollback anomaly fails closed instead of resetting budgets',function(){
    $paths=nutrition_guard_paths();$state=nutrition_guard_initial_state();$state['updated_at']=time()+3600;$state['tokens'][]=['ts'=>time()+3600,'kind'=>'planner','total'=>1000];file_put_contents($paths['state'],json_encode($state));
    expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_storage_unavailable',503);
});

reset_guard();
t('future-dated public snapshot fails closed after clock rollback',function(){
    nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);$paths=nutrition_guard_paths();
    $row=json_decode((string)file_get_contents($paths['status']),true);$row['computed_at']=time()+3600;file_put_contents($paths['status'],json_encode($row));
    $status=nutrition_guard_public_status();if(($status['available']??true)!==false||($status['code']??'')!=='guard_clock_anomaly')throw new RuntimeException('future snapshot accepted');
});

reset_guard();
t('public snapshot is invalidated when either redundant state copy changes',function(){
    nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);$paths=nutrition_guard_paths();
    if(!is_array(nutrition_guard_read_public_snapshot($paths,time())))throw new RuntimeException('fresh snapshot unavailable');
    file_put_contents($paths['backup'],(string)file_get_contents($paths['backup'])."\n");clearstatcache(true,$paths['backup']);
    if(nutrition_guard_read_public_snapshot($paths,time())!==null)throw new RuntimeException('stale snapshot accepted after backup changed');
});

reset_guard();
t('old safe logs are removed by retention policy',function()use($guardDir){$old=$guardDir.'/events-2000-01-01.jsonl';file_put_contents($old,"{}\n");touch($old,time()-30*86400);nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);if(is_file($old))throw new RuntimeException('expired log not removed');});

reset_guard();
t('safe log stops growing at configured cap',function(){putenv('NUTRITION_GEMINI_GUARD_LOG_MAX_BYTES=65536');$paths=nutrition_guard_paths();file_put_contents($paths['log'],str_repeat('x',65536));$before=filesize($paths['log']);nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);clearstatcache(true,$paths['log']);$after=filesize($paths['log']);if($after!==$before)throw new RuntimeException('log exceeded cap');});

reset_guard();
t('state file size has a fail-closed hard limit',function(){putenv('NUTRITION_GEMINI_GUARD_STATE_MAX_BYTES=262144');try{nutrition_guard_with_state(function(array &$state):void{$blob=str_repeat('z',300000);$state['actions'][]=['ts'=>time(),'kind'=>'planner','client'=>$blob,'subnet'=>'x'];});}catch(Throwable $e){if(!str_contains($e->getMessage(),'guard_state_size_limit'))throw $e;return;}throw new RuntimeException('oversized state was accepted');});


reset_guard();
t('minute request budget stops bursts before ten-minute limit',function(){putenv('NUTRITION_GEMINI_PLANNER_CLIENT_MINUTE=2');for($i=0;$i<2;$i++){nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);}expect_guard_error(fn()=>nutrition_guard_begin('planner',1000),'guard_client_minute');});

reset_guard();
t('trusted proxy chain ignores attacker supplied leftmost address',function(){putenv('NUTRITION_GEMINI_TRUST_PROXY=1');putenv('NUTRITION_GEMINI_TRUSTED_PROXIES=10.0.0.0/8');$_SERVER['REMOTE_ADDR']='10.0.0.1';$_SERVER['HTTP_X_FORWARDED_FOR']='1.1.1.1, 203.0.113.50';if(nutrition_guard_normalize_remote_ip()!=='203.0.113.50')throw new RuntimeException('trusted chain selected spoofed leftmost address');});

reset_guard();
t('forwarded proto only affects secure cookies behind trusted proxy',function(){$_SERVER['REMOTE_ADDR']='198.51.100.10';$_SERVER['HTTP_X_FORWARDED_PROTO']='https';if(nutrition_guard_request_is_https())throw new RuntimeException('untrusted proto accepted');putenv('NUTRITION_GEMINI_TRUST_PROXY=1');putenv('NUTRITION_GEMINI_TRUSTED_PROXIES=198.51.100.0/24');if(!nutrition_guard_request_is_https())throw new RuntimeException('trusted proto ignored');});

reset_guard();
t('trusted proxy accepts only the explicitly configured client IP header',function(){
    putenv('NUTRITION_GEMINI_TRUST_PROXY=1');putenv('NUTRITION_GEMINI_TRUSTED_PROXIES=10.0.0.0/8');$_SERVER['REMOTE_ADDR']='10.0.0.1';
    $_SERVER['HTTP_CF_CONNECTING_IP']='203.0.113.77';unset($_SERVER['HTTP_X_FORWARDED_FOR']);
    if(nutrition_guard_normalize_remote_ip()!=='10.0.0.1')throw new RuntimeException('unconfigured CF header trusted');
    putenv('NUTRITION_GEMINI_TRUSTED_CLIENT_IP_HEADER=cf-connecting-ip');
    if(nutrition_guard_normalize_remote_ip()!=='203.0.113.77')throw new RuntimeException('configured CF header ignored');
});

reset_guard();
t('ambiguous failed attempts are charged and each retry is reserved',function(){nutrition_guard_begin('planner',4000);nutrition_guard_before_provider_attempt('model-a');nutrition_guard_record_ambiguous_attempt('transport_error');nutrition_guard_before_provider_attempt('model-a');nutrition_guard_record_usage(['promptTokenCount'=>700,'candidatesTokenCount'=>200,'thoughtsTokenCount'=>100,'toolUsePromptTokenCount'=>50,'totalTokenCount'=>1050]);nutrition_guard_finish(true);$state=state_now();$sum=nutrition_guard_sum_tokens($state['tokens'],time(),3600);if($sum!==5050)throw new RuntimeException('ambiguous retry accounting mismatch: '.$sum);if(count($state['tokens'])!==2)throw new RuntimeException('attempt rows missing');});

reset_guard();
t('definite provider rejection releases reservation without token charge',function(){nutrition_guard_begin('planner',4000);nutrition_guard_before_provider_attempt('model-a');nutrition_guard_release_attempt_reservation('rate_limit');nutrition_guard_finish(false,'rate_limit_requests',60,true);$state=state_now();if(nutrition_guard_sum_tokens($state['tokens'],time(),3600)!==0)throw new RuntimeException('definite rejection was charged');});

reset_guard();
t('missing lease during usage accounting locks AI down',function(){nutrition_guard_begin('planner',4000);nutrition_guard_before_provider_attempt('model-a');$paths=nutrition_guard_paths();nutrition_guard_with_state(function(array &$state):void{$state['inflight']=[];});expect_guard_error(fn()=>nutrition_guard_record_usage(['totalTokenCount'=>500]),'guard_usage_accounting_failed',503);if(!is_file($paths['integrity']))throw new RuntimeException('integrity flag missing');});

reset_guard();
t('previous p0.4 state schema migrates without budget reset',function()use($guardDir){$paths=nutrition_guard_paths();$old=['schema'=>'p0_4_v1','updated_at'=>time(),'actions'=>[['ts'=>time(),'kind'=>'planner','client'=>'c','subnet'=>'s']],'attempts'=>[],'tokens'=>[['ts'=>time(),'kind'=>'planner','total'=>123]],'failures'=>[],'inflight'=>[],'provider_backoff_until'=>0];file_put_contents($paths['state'],json_encode($old));$state=state_now();if(($state['schema']??'')!==NUTRITION_GUARD_SCHEMA||nutrition_guard_sum_tokens($state['tokens'],time(),3600)!==123)throw new RuntimeException('state migration failed');});


reset_guard();
t('cache hit does not erase provider failure circuit',function(){
    for($i=0;$i<4;$i++){nutrition_guard_begin('planner',1000);nutrition_guard_finish(false,'temporary_service_error',3,true);}
    nutrition_guard_begin('planner',1000);nutrition_guard_finish(true,'',0,false,false);
    $state=state_now();if(count($state['failures'])!==4)throw new RuntimeException('cache hit erased provider failures');
    nutrition_guard_begin('planner',1000);nutrition_guard_finish(true,'',0,false,true);
    $state=state_now();if(count($state['failures'])!==0)throw new RuntimeException('verified success did not clear failures');
});

reset_guard();
t('backup refresh failure aborts primary commit',function(){
    nutrition_guard_begin('planner',1000);nutrition_guard_finish(true);
    $paths=nutrition_guard_paths();$before=file_get_contents($paths['state']);
    @unlink($paths['backup']);@mkdir($paths['backup'],0700);
    try{nutrition_guard_with_state(function(array &$state):void{$state['actions'][]=['ts'=>time(),'kind'=>'planner','client'=>'new','subnet'=>'new'];});}
    catch(Throwable $e){
        if(!str_starts_with($e->getMessage(),'guard_backup_'))throw $e;
        $after=file_get_contents($paths['state']);if($after!==$before)throw new RuntimeException('primary changed after backup failure');
        @rmdir($paths['backup']);return;
    }
    @rmdir($paths['backup']);throw new RuntimeException('backup failure was ignored');
});

reset_guard();
t('media reservation accounts for audio duration risk and image tiling',function(){
    $audio=nutrition_guard_estimate_tokens('media',40000,1048576,1,1,0,5200);
    $png=base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXQAAAAASUVORK5CYII=',true);
    $imageReserve=media_modality_token_reserve([['kind'=>'image','data'=>$png]]);
    $image=nutrition_guard_estimate_tokens('media',40000,680*1024,1,0,1,5200,$imageReserve);
    if($audio<150000)throw new RuntimeException('audio reservation too low: '.$audio);
    if($imageReserve!==258||$image<100000||$image>=200000)throw new RuntimeException('image reservation unreasonable: '.$imageReserve.'/'.$image);
});

reset_guard();
t('Gemini 3 payloads pin LOW thinking and do not override temperature',function(){
    $source=file_get_contents(dirname(__DIR__).'/api/gemini.php');if(!is_string($source))throw new RuntimeException('source unavailable');
    if(substr_count($source,"'thinkingConfig'=>['thinkingLevel'=>'LOW']")!==6)throw new RuntimeException('not every generation path pins LOW thinking');
    if(str_contains($source,"'temperature'=>"))throw new RuntimeException('Gemini 3 temperature override remains');
});

reset_guard();
t('production model set is pinned and arbitrary compatibility models are rejected',function(){
    $expected=[GEMINI_MODEL,GEMINI_FALLBACK_MODEL];if(gemini_model_candidates()!==$expected)throw new RuntimeException('default model list is not pinned');
    foreach($expected as$model)if(str_contains($model,'latest')||str_contains($model,'preview'))throw new RuntimeException('floating or preview model enabled');
    putenv('NUTRITION_GEMINI_COMPATIBILITY_MODEL=gemini-3.1-pro-preview');if(gemini_model_candidates()!==$expected)throw new RuntimeException('unpriced compatibility model accepted');
    putenv('NUTRITION_GEMINI_COMPATIBILITY_MODEL=gemini-flash-latest');if(gemini_model_candidates()!==$expected)throw new RuntimeException('floating compatibility alias accepted');
    putenv('NUTRITION_GEMINI_COMPATIBILITY_MODEL');
});


reset_guard();
t('monetary ledger prices input separately from output and thinking',function(){
    nutrition_guard_begin('planner',5000);nutrition_guard_before_provider_attempt('gemini-3.5-flash');
    nutrition_guard_record_usage(['promptTokenCount'=>900,'candidatesTokenCount'=>300,'thoughtsTokenCount'=>100,'totalTokenCount'=>1300]);nutrition_guard_finish(true);
    $state=state_now();$row=$state['costs'][0]??[];
    if(($row['micro_usd']??0)!==4950)throw new RuntimeException('unexpected monetary accounting: '.json_encode($row));
});

reset_guard();
t('monetary reservation prevents concurrent cost overshoot',function(){
    putenv('NUTRITION_GEMINI_COST_MICRO_USD_PER_HOUR=100000');putenv('NUTRITION_GEMINI_GLOBAL_CONCURRENCY=5');
    nutrition_guard_begin('planner',8000);$first=$GLOBALS['NUTRITION_GEMINI_GUARD_LEASE'];unset($GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']);
    $_SERVER['REMOTE_ADDR']='203.0.113.8';expect_guard_error(fn()=>nutrition_guard_begin('planner',4000),'guard_cost_hour');
    $GLOBALS['NUTRITION_GEMINI_GUARD_LEASE']=$first;nutrition_guard_finish(true);
});

reset_guard();
t('ambiguous provider outcome is charged at conservative output rate',function(){
    nutrition_guard_begin('planner',4200);nutrition_guard_before_provider_attempt('gemini-3.5-flash');nutrition_guard_record_ambiguous_attempt('transport_error');nutrition_guard_finish(false,'temporary_service_error',3,true);
    $state=state_now();$row=$state['costs'][0]??[];if(($row['micro_usd']??0)!==37800||empty($row['estimated']))throw new RuntimeException('ambiguous cost not conservative');
});

reset_guard();
t('public health closes when monetary day budget is exhausted',function(){
    putenv('NUTRITION_GEMINI_COST_MICRO_USD_PER_DAY=10000');
    nutrition_guard_with_state(function(array &$state):void{$state['costs'][]=['ts'=>time(),'kind'=>'planner','micro_usd'=>10000,'estimated'=>false];});
    $status=nutrition_guard_public_status();if(($status['available']??true)!==false||($status['code']??'')!=='guard_cost_day')throw new RuntimeException('health did not expose cost closure: '.json_encode($status));
});

reset_guard();
t('schema migration reconstructs monetary history without budget reset',function(){
    $paths=nutrition_guard_paths();$old=['schema'=>'p0_4_1_v2','updated_at'=>time(),'actions'=>[],'attempts'=>[],'tokens'=>[['ts'=>time(),'kind'=>'planner','prompt'=>100,'output'=>50,'thoughts'=>10,'tool_use'=>0,'total'=>160,'estimated'=>false]],'failures'=>[],'inflight'=>[],'provider_backoff_until'=>0];
    file_put_contents($paths['state'],json_encode($old));$state=state_now();if(($state['schema']??'')!==NUTRITION_GUARD_SCHEMA||count($state['costs']??[])!==1||($state['costs'][0]['micro_usd']??0)<=0)throw new RuntimeException('monetary migration failed');
});

reset_guard();
t('paid Search grounding remains hard-disabled until query costs are ledgered',function(){
    if(gemini_search_grounding_enabled())throw new RuntimeException('grounding unexpectedly enabled');
    try{media_lookup_body([]);}catch(RuntimeException $e){if($e->getMessage()!=='search_grounding_disabled_by_cost_guard')throw $e;return;}throw new RuntimeException('grounding body was created');
});

reset_guard();
t('cost arithmetic saturates instead of overflowing',function(){
    if(nutrition_guard_ceil_mul_div(PHP_INT_MAX,PHP_INT_MAX)!==PHP_INT_MAX)throw new RuntimeException('multiplication did not saturate');
    if(nutrition_guard_safe_add_int(PHP_INT_MAX,1)!==PHP_INT_MAX)throw new RuntimeException('addition did not saturate');
});

$logFiles=glob($guardDir.'/events-*.jsonl')?:[];
$logSafe=true;
foreach($logFiles as $f){$raw=file_get_contents($f);if(str_contains((string)$raw,'198.51.100.10')||str_contains((string)$raw,'X-goog-api-key'))$logSafe=false;}
t('safe log contains no raw IP or credential header',function()use(&$logSafe){if(!$logSafe)throw new RuntimeException('unsafe log');});

foreach(glob($guardDir.'/*')?:[] as $f)@unlink($f);@rmdir($guardDir);
echo json_encode(['status'=>'PASS','cases'=>$cases,'results'=>$results],JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)."\n";
