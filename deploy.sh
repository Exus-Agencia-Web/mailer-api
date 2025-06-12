clear
echo "  _       _               _____                                  _    "
echo " | |     (_)             / ____|                                | |   "
echo " | |      _ __   __ ___ | |      ___   _ __   _ __    ___   ___ | |_  "
echo " | |     | |\ \ / // _ \| |     / _ \ | '_ \ | '_ \  / _ \ / __|| __| "
echo " | |____ | | \ V /|  __/| |____| (_) || | | || | | ||  __/| (__ | |_  "
echo " |______||_|  \_/  \___| \_____|\___/ |_| |_||_| |_| \___| \___| \__| "
echo ""
echo ""

CLOUD="AWS1"
ZONE="us-east-1"

echo "Descargando cambios de GIT"
#git pull
echo ""

sam build --profile=$CLOUD
sam deploy --profile=$CLOUD
rm -rf .aws-sam

echo ""
echo "Listo!"
dt=$(date '+%d/%m/%Y %H:%M:%S');
echo "Fecha: ${dt}"
echo ""
echo ""
