#!/usr/bin/env python3
"""
Script para automatizar a migração de className para sx props ou inline styles.
"""
import re
import sys
from pathlib import Path

# Mapeamentos comuns de Tailwind para styles inline
SIMPLE_MAPPINGS = {
    r'className="([^"]*)"': lambda m: convert_classname(m.group(1)),
}

def convert_classname(classes):
    """Converte classes Tailwind para sx ou style inline."""
    parts = []
    style_props = {}
    
    # Mapeamento de classes comuns
    class_map = {
        'flex': 'display: "flex"',
        'flex-col': 'flexDirection: "column"',
        'flex-row': 'flexDirection: "row"',
        'items-center': 'alignItems: "center"',
        'items-start': 'alignItems: "flex-start"',
        'items-end': 'alignItems: "flex-end"',
        'justify-center': 'justifyContent: "center"',
        'justify-between': 'justifyContent: "space-between"',
        'justify-start': 'justifyContent: "flex-start"',
        'justify-end': 'justifyContent: "flex-end"',
        'gap-1': 'gap: 1',
        'gap-2': 'gap: 2',
        'gap-3': 'gap: 3',
        'gap-4': 'gap: 4',
        'gap-6': 'gap: 6',
        'space-y-1': 'display: "flex", flexDirection: "column", gap: 1',
        'space-y-2': 'display: "flex", flexDirection: "column", gap: 2',
        'space-y-3': 'display: "flex", flexDirection: "column", gap: 3',
        'space-y-4': 'display: "flex", flexDirection: "column", gap: 4',
        'space-y-6': 'display: "flex", flexDirection: "column", gap: 6',
        'w-full': 'width: "100%"',
        'h-full': 'height: "100%"',
        'max-w-sm': 'maxWidth: "24rem"',
        'max-w-md': 'maxWidth: "28rem"',
        'max-w-lg': 'maxWidth: "32rem"',
        'p-2': 'p: 2',
        'p-4': 'p: 4',
        'p-6': 'p: 6',
        'px-2': 'px: 2',
        'px-4': 'px: 4',
        'py-2': 'py: 2',
        'py-4': 'py: 4',
        'mt-2': 'mt: 2',
        'mt-4': 'mt: 4',
        'mb-2': 'mb: 2',
        'mb-4': 'mb: 4',
        'mr-2': 'marginRight: "0.5rem"',
        'ml-2': 'marginLeft: "0.5rem"',
        'text-sm': 'fontSize: theme => theme.typography.pxToRem(14)',
        'text-xs': 'fontSize: theme => theme.typography.pxToRem(12)',
        'font-medium': 'fontWeight: theme => theme.typography.fontWeightMedium',
        'font-bold': 'fontWeight: theme => theme.typography.fontWeightBold',
    }
    
    tokens = classes.split()
    sx_parts = []
    
    for token in tokens:
        if token in class_map:
            sx_parts.append(class_map[token])
    
    if sx_parts:
        return f'sx={{{{ {", ".join(sx_parts)} }}}}'
    
    # Se não conseguiu mapear, manter className temporariamente
    return f'className="{classes}"'

def process_file(filepath):
    """Processa um arquivo TypeScript/TSX."""
    content = Path(filepath).read_text()
    
    # Substituições simples de ícones Lucide
    content = re.sub(r'<([A-Z][a-zA-Z]+) className="(h-\d+ w-\d+[^"]*)" />', 
                     lambda m: f'<{m.group(1)} style={{{{ width: "1rem", height: "1rem" }}}} />', 
                     content)
    
    # Forms com space-y
    content = re.sub(r'<form([^>]*)className="space-y-(\d+)([^"]*)"', 
                     lambda m: f'<form{m.group(1)}style={{{{ display: "flex", flexDirection: "column", gap: "{int(m.group(2))*0.25}rem" }}}}', 
                     content)
    
    return content

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python migrate-classnames.py <file>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    result = process_file(filepath)
    print(result)
