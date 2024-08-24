#!/bin/sh

_step_counter=0
step() {
	_step_counter=$(( _step_counter + 1 ))
	printf '\n\033[1;36m%d) %s\033[0m\n' $_step_counter "$@" >&2  # bold cyan
}

uname -a

step 'Set up timezone'
setup-timezone -z Europe/Berlin

step 'Set up keymap to de de (Im tired)'
setup-keymap de de

step 'Set up networking'
cat > /etc/network/interfaces <<-EOF
	iface lo inet loopback
	iface eth0 inet dhcp
EOF
ln -s networking /etc/init.d/net.lo
ln -s networking /etc/init.d/net.eth0

step 'Adjust rc.conf'
sed -Ei \
	-e 's/^[# ](rc_depend_strict)=.*/\1=NO/' \
	-e 's/^[# ](rc_logger)=.*/\1=YES/' \
	-e 's/^[# ](unicode)=.*/\1=YES/' \
	/etc/rc.conf
#service docker start
#curl http://0.0.0.0:9000/cozycast-worker-latest.tar | docker image load
#service docker stop

step 'Install cozycast apk'
apk add --allow-untrusted /usr/local/packages/x86_64/cozycast-0.1.0-r1.apk

step 'Enable cloud-init'
setup-cloud-init

step 'Enable services'
rc-update add docker default
rc-update add load-cozycast-worker-image default
rc-update add cozycast-worker default
rc-update add acpid default
rc-update add chronyd default
rc-update add crond default
rc-update add net.eth0 default
rc-update add net.lo boot
rc-update add termencoding boot

step 'List /usr/local/bin'
ls -la /usr/local/bin
