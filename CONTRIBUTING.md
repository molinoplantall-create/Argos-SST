# Guía de Contribución

## Mensajes de Commit
Utilizamos [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) para nuestros mensajes de commit. Esto es validado automáticamente por `commitlint` a través de `husky`.

### Formato

```
<tipo>[scope opcional]: <descripción en minúsculas>
```

### Tipos permitidos
- `feat`: Una nueva característica.
- `fix`: Una corrección de un error (bug).
- `chore`: Tareas de mantenimiento, actualización de dependencias, etc.
- `docs`: Cambios exclusivos en la documentación.
- `refactor`: Un cambio en el código que ni corrige un error ni añade una característica.
- `perf`: Un cambio en el código que mejora el rendimiento.
- `style`: Cambios que no afectan el significado del código (espacios, formateo, punto y coma, etc).
- `test`: Añadir tests que faltan o corregir tests existentes.

### Scopes sugeridos (opcionales)
- `epp`
- `inspections`
- `auth`

Ejemplo válido:
`feat(epp): agregar selector de tallas para el catálogo`
`fix(auth): corregir caída en el login al recibir error 500`
