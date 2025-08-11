import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          // Minimum 8 characters
          if (value.length < 8) return false;
          
          // At least one uppercase letter
          if (!/[A-Z]/.test(value)) return false;
          
          // At least one lowercase letter
          if (!/[a-z]/.test(value)) return false;
          
          // At least one number
          if (!/\d/.test(value)) return false;
          
          // At least one special character
          if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return false;
          
          // No common patterns
          const commonPatterns = [
            'password', '123456', 'qwerty', 'admin', 'user',
            'letmein', 'welcome', 'monkey', 'dragon', 'master'
          ];
          
          if (commonPatterns.some(pattern => 
            value.toLowerCase().includes(pattern) || 
            value.toLowerCase().includes(pattern.split('').reverse().join(''))
          )) {
            return false;
          }
          
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be at least 8 characters long and contain uppercase, lowercase, number, and special character`;
        },
      },
    });
  };
}
