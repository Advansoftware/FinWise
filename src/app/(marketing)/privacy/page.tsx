// src/app/(marketing)/privacy/page.tsx
import { Container, Typography, Box, Paper, Link as MuiLink, Stack, Divider } from "@mui/material";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade - Gastometria",
  description: "Conheça como o Gastometria coleta, usa e protege seus dados pessoais.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "14 de Dezembro de 2024";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Link href="/" passHref>
          <MuiLink
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              mb: 4,
              color: "text.secondary",
              textDecoration: "none",
              "&:hover": { color: "primary.main" },
            }}
          >
            <ArrowLeft size={16} />
            Voltar ao início
          </MuiLink>
        </Link>

        <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 3 }}>
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
            Política de Privacidade
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Última atualização: {lastUpdated}
          </Typography>

          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                1. Introdução
              </Typography>
              <Typography variant="body1" color="text.secondary">
                O Gastometria ("nós", "nosso" ou "nossa") está comprometido em proteger sua privacidade. 
                Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas 
                informações pessoais quando você utiliza nosso aplicativo de gestão financeira pessoal.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                2. Informações que Coletamos
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <strong>2.1. Informações de Cadastro:</strong>
                <ul>
                  <li>Nome completo</li>
                  <li>Endereço de e-mail</li>
                  <li>Senha (armazenada de forma criptografada)</li>
                </ul>
                
                <strong>2.2. Dados Financeiros:</strong>
                <ul>
                  <li>Transações (receitas e despesas)</li>
                  <li>Categorias de gastos</li>
                  <li>Metas financeiras</li>
                  <li>Orçamentos</li>
                  <li>Carteiras e saldos</li>
                </ul>

                <strong>2.3. Dados de Uso:</strong>
                <ul>
                  <li>Informações sobre como você utiliza o aplicativo</li>
                  <li>Preferências e configurações</li>
                  <li>Logs de acesso</li>
                </ul>
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                3. Como Usamos suas Informações
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                Utilizamos suas informações para:
                <ul>
                  <li>Fornecer e manter o serviço Gastometria</li>
                  <li>Processar suas transações e manter histórico financeiro</li>
                  <li>Gerar relatórios e análises financeiras personalizadas</li>
                  <li>Oferecer recomendações através de nossa IA</li>
                  <li>Notificá-lo sobre atualizações importantes</li>
                  <li>Melhorar nosso serviço com base em feedback e uso</li>
                </ul>
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                4. Proteção de Dados
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações, incluindo:
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <ul>
                  <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                  <li>Criptografia de senhas com algoritmos seguros (bcrypt)</li>
                  <li>Armazenamento seguro em servidores protegidos</li>
                  <li>Controle de acesso restrito aos dados</li>
                  <li>Monitoramento contínuo de segurança</li>
                </ul>
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                5. Compartilhamento de Dados
              </Typography>
              <Typography variant="body1" color="text.secondary">
                <strong>Não vendemos, alugamos ou comercializamos seus dados pessoais.</strong> Podemos compartilhar 
                informações apenas:
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <ul>
                  <li>Com provedores de serviço que nos auxiliam na operação (hospedagem, análise)</li>
                  <li>Para cumprir obrigações legais ou regulatórias</li>
                  <li>Com seu consentimento explícito</li>
                </ul>
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                6. Seus Direitos (LGPD)
              </Typography>
              <Typography variant="body1" color="text.secondary">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <ul>
                  <li>Confirmar a existência de tratamento de seus dados</li>
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incompletos ou desatualizados</li>
                  <li>Solicitar anonimização ou exclusão de dados</li>
                  <li>Revogar o consentimento a qualquer momento</li>
                  <li>Solicitar portabilidade dos dados</li>
                </ul>
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                7. Cookies e Tecnologias Similares
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, incluindo:
              </Typography>
              <Typography variant="body1" color="text.secondary" component="div">
                <ul>
                  <li>Cookies de sessão para manter você logado</li>
                  <li>Cookies de preferências para lembrar suas configurações</li>
                  <li>Armazenamento local para funcionalidade offline</li>
                </ul>
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                8. Retenção de Dados
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer 
                nossos serviços. Você pode solicitar a exclusão de sua conta e dados a qualquer momento 
                entrando em contato conosco.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                9. Alterações nesta Política
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre 
                alterações significativas por e-mail ou através de um aviso em nosso aplicativo.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                10. Contato
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados, 
                entre em contato conosco através do e-mail: <strong>privacidade@gastometria.com</strong>
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Gastometria. Todos os direitos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
