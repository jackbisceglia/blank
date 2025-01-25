export const domain = 'withblank.com';

export function SecretWithEnvFallback (secretName: string) {
    function camelToUppercaseSnake (str: string){
        return str
          .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
          .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
          .toUpperCase()
        };
          
    const secret = new sst.Secret(secretName, camelToUppercaseSnake(secretName))
    
    return secret.value;
}