#!/bin/bash
#source /home/qinghao/.bashrc
#source /etc/profile


#echo $PATH
date
count=0
choose=-1

mongostat=`ps -x | grep "mongod --dbpath /home/iwen/www/html/mongodb/data/db --logpath /home/iwen/www/html/mongodb/log/mongodb.log --fork" | grep -v grep`
echo $mongostat
if [[ $mongostat =~ "mongod" ]]
then
    echo "mongod normal"
else
    echo "mongod down"
    mongod --dbpath /home/iwen/www/html/mongodb/data/db --logpath /home/iwen/www/html/mongodb/log/mongodb.log --fork
    pm2 reload all
    pm2 restart all
    echo "mongod restarted"
fi

indexNeedChange=1
filesNeedChange=1

IFS=$'\n'
for line in `pm2 -m status`
do
    let "count = $count + 1"
    if [[ $line =~ "+--- index" ]]
    then
        let "choose = 0"
    elif [[ $line =~ "+--- file" ]]
    then
        let "choose = 1"
    elif [[ $line =~ "status" ]]
    then
        if [ $choose -eq 0 ]
        then
            if [[ $line =~ "online" ]]
            then
                echo "pm2 index normal"
                let "indexNeedChange = 0"
            fi
        elif [ $choose -eq 1 ]
        then
            if [[ $line =~ "online" ]]
            then
                echo "pm2 files normal"
                let "filesNeedChange = 0"
            fi
        else
            echo "other status"
        fi
    elif [[ $line =~ "+---" ]]
    then
        let "choose = -1"
    fi
done

if [ $indexNeedChange -eq 1 ]
then
    echo "pm2 index down"
    pm2 stop /home/iwen/www/html/fastread/index.js
    pid=`fuser -n tcp 8687`
    kill -9 $pid
    pm2 start /home/iwen/www/html/fastread/index.js
    echo "pm2 index restarted"
fi

if [ $filesNeedChange -eq 1 ]
then
    echo "pm2 files down"
    cd /home/iwen/www/data
    pm2 stop files
    pm2 start /home/qinghao/local/bin/http-server --name files -- -p 8688 -d false
    echo "pm2 files restarted"
fi

echo "======================================================================================================"
