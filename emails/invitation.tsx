import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Hr,
} from '@react-email/components'

interface InvitationEmailProps {
  inviterName: string
  workspaceName: string
  inviteUrl: string
}

export function InvitationEmail({ inviterName, workspaceName, inviteUrl }: InvitationEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5', margin: 0 }}>
        <Container
          style={{
            maxWidth: 480,
            margin: '40px auto',
            backgroundColor: '#ffffff',
            padding: 32,
            borderRadius: 12,
            border: '1px solid #e4e4e7',
          }}
        >
          <Heading style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#09090b' }}>
            Te invitaron a Danu
          </Heading>
          <Text style={{ fontSize: 14, color: '#52525b', lineHeight: 1.6 }}>
            <strong>{inviterName}</strong> te invita a unirte al workspace{' '}
            <strong>{workspaceName}</strong> en Danu, la plataforma de gestión de proyectos.
          </Text>
          <Button
            href={inviteUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              marginTop: 16,
            }}
          >
            Aceptar invitación
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ fontSize: 12, color: '#a1a1aa' }}>
            Este enlace expira en 7 días. Si no esperabas esta invitación, puedes ignorar este
            correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
