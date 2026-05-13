# Acerca de este documento: 
El presente documento tiene por objeto compartir investigaciones durante
el desarrollo de este programa, donde ambos participantes, Aureliano Aristizabal
y Sebastián Gutierrez, comparten ideas y documentan ciertos conceptos para facilitar el aprendizaje y comprensión mutua. 

Este documento no pretende ser una guía técnica en sí, se usará ciertas analogías y vocabulario lo más simplificado posible para incentivar la comprensión.

# Acerca del LocalStorage:

1. El local storage es una API del navegador.

2. Una API es un puente entre un cliente y un servidor. 

3. En este caso, el cliente es el navegador que a su vez,
podría entenderse como un servidor, aunque realmente en
sí, lo que hace es mediar a través de su API LOCALSTORAGE
para obtener y almacenar información localmente, es decir un puente para el programador y el OS a través del navegador. Entendiendo que 
todo proceso que conlleve guardar u obtener información,
es un proceso que se comunica con el sistema operativo
y hace un system call para obtener o guardar data en el hardware, sea disco duro, caché, ram, etc.

4. Basicamente, el navegador a través de su API LocalStorage autoriza al software web a guardar y obtener información localmente a través del mismo navegador. 

