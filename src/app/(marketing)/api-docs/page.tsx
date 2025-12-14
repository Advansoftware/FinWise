"use client";

import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Divider,
  Alert,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  ChevronDown,
  Lock,
  Key,
  User,
  RefreshCw,
  Copy,
  CheckCircle,
  ArrowLeft,
  Terminal,
  Smartphone,
  Shield,
  Zap,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

// Method badge colors
const methodColors: Record<string, string> = {
  GET: "#4caf50",
  POST: "#2196f3", 
  PUT: "#ff9800",
  DELETE: "#f44336",
  PATCH: "#9c27b0",
};

interface Endpoint {
  method: string;
  path: string;
  title: string;
  description: string;
  requiresAuth: boolean;
  requestBody?: {
    fields: { name: string; type: string; required: boolean; description: string }[];
    example: object;
  };
  responseExample: object;
  errors?: { code: number; message: string }[];
}

const endpoints: Endpoint[] = [
  {
    method: "POST",
    path: "/api/mobile/login",
    title: "Login",
    description: "Autentica o usuário e retorna tokens JWT para acesso à API.",
    requiresAuth: false,
    requestBody: {
      fields: [
        { name: "email", type: "string", required: true, description: "Email do usuário cadastrado" },
        { name: "password", type: "string", required: true, description: "Senha do usuário" },
      ],
      example: {
        email: "usuario@email.com",
        password: "sua_senha_aqui"
      }
    },
    responseExample: {
      user: {
        id: "abc123def456",
        email: "usuario@email.com",
        displayName: "João Silva",
        plan: "Infinity",
        aiCredits: 500
      },
      tokens: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        expiresIn: 3600
      }
    },
    errors: [
      { code: 400, message: "Email ou senha não fornecidos" },
      { code: 401, message: "Credenciais inválidas" },
      { code: 403, message: "Plano não é Infinity - API Mobile requer plano Infinity" },
    ]
  },
  {
    method: "POST",
    path: "/api/mobile/refresh",
    title: "Refresh Token",
    description: "Renova o access token usando o refresh token. Use quando o access token expirar.",
    requiresAuth: false,
    requestBody: {
      fields: [
        { name: "refreshToken", type: "string", required: true, description: "Refresh token obtido no login" },
      ],
      example: {
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    },
    responseExample: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      expiresIn: 3600
    },
    errors: [
      { code: 400, message: "Refresh token não fornecido" },
      { code: 401, message: "Refresh token inválido ou expirado" },
      { code: 403, message: "Plano não é mais Infinity" },
    ]
  },
  {
    method: "GET",
    path: "/api/mobile/me",
    title: "Dados do Usuário",
    description: "Retorna os dados do usuário autenticado atual.",
    requiresAuth: true,
    responseExample: {
      user: {
        id: "abc123def456",
        email: "usuario@email.com",
        displayName: "João Silva",
        plan: "Infinity",
        aiCredits: 500
      }
    },
    errors: [
      { code: 401, message: "Token não fornecido ou inválido" },
      { code: 403, message: "Plano não é Infinity" },
    ]
  },
];

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <IconButton
        size="small"
        onClick={handleCopy}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          bgcolor: "background.paper",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        {copied ? <CheckCircle size={16} color="#4caf50" /> : <Copy size={16} />}
      </IconButton>
      <Paper
        sx={{
          p: 2,
          bgcolor: "#1a1a2e",
          borderRadius: 2,
          overflow: "auto",
          maxHeight: 400,
        }}
      >
        <pre style={{ margin: 0, fontSize: "0.875rem", color: "#e0e0e0" }}>
          <code>{code}</code>
        </pre>
      </Paper>
    </Box>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        bgcolor: "background.paper",
        borderRadius: 2,
        mb: 2,
        "&:before": { display: "none" },
        border: "1px solid",
        borderColor: "divider",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown />}
        sx={{
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            gap: 2,
          },
        }}
      >
        <Chip
          label={endpoint.method}
          size="small"
          sx={{
            bgcolor: methodColors[endpoint.method],
            color: "white",
            fontWeight: 700,
            minWidth: 60,
          }}
        />
        <Typography
          sx={{
            fontFamily: "monospace",
            fontSize: "0.95rem",
            color: "text.primary",
          }}
        >
          {endpoint.path}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto", mr: 2 }}>
          {endpoint.title}
        </Typography>
        {endpoint.requiresAuth && (
          <Tooltip title="Requer autenticação">
            <Lock size={16} color="#ff9800" />
          </Tooltip>
        )}
      </AccordionSummary>

      <AccordionDetails>
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {endpoint.description}
          </Typography>

          {endpoint.requiresAuth && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Autenticação necessária:</strong> Inclua o header{" "}
              <code>Authorization: Bearer {"<"}accessToken{">"}</code>
            </Alert>
          )}

          {endpoint.requestBody && (
            <>
              <Typography variant="h6" sx={{ mb: 2, fontSize: "1rem" }}>
                📤 Request Body
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2, bgcolor: "action.hover" }}>
                <Stack spacing={1}>
                  {endpoint.requestBody.fields.map((field) => (
                    <Box key={field.name} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                      <Typography sx={{ fontFamily: "monospace", color: "primary.main", minWidth: 120 }}>
                        {field.name}
                      </Typography>
                      <Chip label={field.type} size="small" variant="outlined" />
                      {field.required && <Chip label="required" size="small" color="error" />}
                      <Typography variant="body2" color="text.secondary">
                        {field.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                Exemplo:
              </Typography>
              <CodeBlock code={JSON.stringify(endpoint.requestBody.example, null, 2)} />
            </>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2, fontSize: "1rem" }}>
            📥 Response (200 OK)
          </Typography>
          <CodeBlock code={JSON.stringify(endpoint.responseExample, null, 2)} />

          {endpoint.errors && endpoint.errors.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2, fontSize: "1rem" }}>
                ❌ Erros Possíveis
              </Typography>
              <Stack spacing={1}>
                {endpoint.errors.map((error) => (
                  <Box
                    key={error.code}
                    sx={{
                      display: "flex",
                      gap: 2,
                      p: 1.5,
                      bgcolor: "error.dark",
                      borderRadius: 1,
                      alignItems: "center",
                    }}
                  >
                    <Chip label={error.code} size="small" color="error" />
                    <Typography variant="body2">{error.message}</Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default function ApiDocsPage() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://gastometria.vercel.app";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Header */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit" }}>
            <Logo sx={{ width: 28, height: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Gastometria
            </Typography>
          </Link>
          <Button variant="outlined" component={Link} href="/" startIcon={<ArrowLeft size={18} />}>
            Voltar
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Hero */}
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Chip
            icon={<Terminal size={16} />}
            label="API Reference"
            color="primary"
            sx={{ mb: 2 }}
          />
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: "2rem", md: "3rem" } }}>
            API Mobile do Gastometria
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
            Integre seu aplicativo Flutter ou qualquer cliente HTTP com a plataforma Gastometria.
          </Typography>
        </Box>

        {/* Features */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mb: 6 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Shield size={40} color="#4caf50" />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                Autenticação JWT
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tokens seguros com expiração automática
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Smartphone size={40} color="#2196f3" />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                Mobile First
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Otimizada para apps Flutter, React Native, etc.
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: "center", py: 3 }}>
              <Zap size={40} color="#ff9800" />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
                Plano Infinity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Exclusivo para assinantes Infinity
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Base URL */}
        <Paper sx={{ p: 3, mb: 6, bgcolor: "primary.dark", borderRadius: 3 }}>
          <Typography variant="overline" sx={{ color: "primary.light" }}>
            Base URL
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: "monospace",
              color: "white",
              mt: 1,
            }}
          >
            {baseUrl}/api/mobile
          </Typography>
        </Paper>

        {/* Quick Start */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            🚀 Quick Start
          </Typography>
          <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              1. Faça login para obter seus tokens:
            </Typography>
            <CodeBlock
              language="bash"
              code={`curl -X POST ${baseUrl}/api/mobile/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "seu@email.com", "password": "sua_senha"}'`}
            />
            <Typography variant="body1" sx={{ mt: 3, mb: 2 }}>
              2. Use o accessToken nas próximas requisições:
            </Typography>
            <CodeBlock
              language="bash"
              code={`curl ${baseUrl}/api/mobile/me \\
  -H "Authorization: Bearer SEU_ACCESS_TOKEN"`}
            />
          </Paper>
        </Box>

        {/* Endpoints */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            📡 Endpoints
          </Typography>
          {endpoints.map((endpoint, index) => (
            <EndpointCard key={index} endpoint={endpoint} />
          ))}
        </Box>

        {/* Flutter Example */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            📱 Exemplo Flutter
          </Typography>
          <CodeBlock
            language="dart"
            code={`import 'dart:convert';
import 'package:http/http.dart' as http;

class GastometriaApi {
  static const String baseUrl = '${baseUrl}/api/mobile';
  String? _accessToken;
  String? _refreshToken;

  Future<bool> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('\$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _accessToken = data['tokens']['accessToken'];
      _refreshToken = data['tokens']['refreshToken'];
      return true;
    }
    return false;
  }

  Future<Map<String, dynamic>?> getMe() async {
    final response = await http.get(
      Uri.parse('\$baseUrl/me'),
      headers: {'Authorization': 'Bearer \$_accessToken'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else if (response.statusCode == 401) {
      // Token expirado, tentar refresh
      if (await refreshToken()) {
        return getMe(); // Retry
      }
    }
    return null;
  }

  Future<bool> refreshToken() async {
    final response = await http.post(
      Uri.parse('\$baseUrl/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refreshToken': _refreshToken}),
    );

    if (response.statusCode == 200) {
      _accessToken = jsonDecode(response.body)['accessToken'];
      return true;
    }
    return false;
  }
}`}
          />
        </Box>

        {/* Security */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            🔒 Notas de Segurança
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Access tokens expiram em <strong>1 hora</strong></li>
            <li>Refresh tokens expiram em <strong>7 dias</strong></li>
            <li>O plano Infinity é verificado em <strong>cada requisição</strong></li>
            <li>Sempre use <strong>HTTPS</strong> em produção</li>
          </ul>
        </Alert>

        {/* Footer */}
        <Box sx={{ textAlign: "center", py: 4, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Gastometria. Todos os direitos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
