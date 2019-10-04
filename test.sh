#!/bin/bash

build_type="prod"
upload_version=1.0.0
upload_desc=1111

if [ "$build_type" == "prod" ] || [ "$build_type" == "build" ]
  then
    mini-deploy --mode=upload --workspace ~/WorkSpace/implement --ver=$upload_version --desc="$upload_desc" --login.format=image --login.qr='login.png' --no-resume

    let "result |= $?"

    if [ "$result" == "0" ]
      then
        # 发送通知到钉钉群
        echo "yarn run notify"
      fi
else
  mini-deploy --mode=preview --workspace ~/WorkSpace/implement/ --login.format=image --login.qr='login.png' --no-resume --workspace ~/WorkSpace/implement

  let "result |= $?"

  if [ "$result" == "2" ]
    then
    	echo "need login"
  fi
fi
