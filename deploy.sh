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
STACK="pagegear-mailer-api"

echo "Descargando cambios de GIT"
#git pull
echo ""

# Validar la plantilla SAM antes de continuar
sam validate --profile=$CLOUD --region=$ZONE
if [ $? -ne 0 ]; then
  echo "La validación de SAM falló; abortando despliegue."
  exit 1
fi

# Verificar el estado actual del stack y eliminar si no se puede actualizar
status=$(aws cloudformation describe-stacks --profile $CLOUD --region $ZONE --stack-name $STACK --query "Stacks[0].StackStatus" --output text 2>/dev/null)

if [[ "$status" == "ROLLBACK_FAILED" || "$status" == "ROLLBACK_COMPLETE" || "$status" == "CREATE_FAILED" || "$status" == "DELETE_FAILED" ]]; then
  echo "El stack $STACK está en estado $status. Eliminándolo antes de continuar..."
  aws cloudformation delete-stack --stack-name $STACK --region $ZONE --profile $CLOUD
  echo "Esperando a que se elimine el stack..."
  aws cloudformation wait stack-delete-complete --stack-name $STACK --region $ZONE --profile $CLOUD
fi

sam build --profile=$CLOUD
sam deploy --profile=$CLOUD --region=$ZONE
rm -rf .aws-sam

echo ""
echo "Listo!"
dt=$(date '+%d/%m/%Y %H:%M:%S');
echo "Fecha: ${dt}"
echo ""
echo ""
