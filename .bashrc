export FIREBASE_TOKEN=TON_TOKEN_ICI
alias deploy='/data/data/com.termux/files/home/SentinelQuantumVanguardAiPro/deploy.sh'
alias deploy='/data/data/com.termux/files/home/SentinelQuantumVanguardAiPro/deploy.sh'
alias deploy='./deploy.sh'
alias cfdeploy='cd /chemin/vers/ton-repo && ./deploy_pages.sh --auto'
alias cfstat='/data/data/com.termux/files/home/cf_pages_status.sh | jq -C .'
alias cfdeploy='/data/data/com.termux/files/home/deploy_pages.sh --auto'

# Charger automatiquement ~/.env
set -a; [ -f ~/.env ] && . ~/.env; set +a
export PATH="$HOME/bin:$PATH"
export PATH=$HOME/bin:$PATH
alias deploy="./deploy_now.sh"
