import { CheckCircle2, Mail, Calendar, Hash, FileText, X } from 'lucide-react';
import { getCurrentLanguage } from '../utils/languageManager';

interface TicketConfirmationProps {
  ticketNumber: string;
  issueType: string;
  description: string;
  priority: string;
  timestamp: number;
  onClose: () => void;
}

const TRANSLATIONS = {
  en: {
    title: 'Ticket Confirmation',
    subtitle: 'Your support ticket has been created successfully',
    ticketCreated: 'Ticket Created Successfully!',
    ticketNumber: 'Ticket Number',
    issueType: 'Issue Type',
    description: 'Issue Description',
    priority: 'Priority',
    createdOn: 'Created On',
    whatNext: 'What happens next?',
    step1: 'Our support team will review your ticket',
    step2: 'We\'ll send updates to your email',
    step3: 'You can track progress in "My Tickets"',
    step4: 'Average response time: 2-4 hours',
    estimatedResponse: 'Estimated Response Time',
    businessHours: '2-4 hours (during business hours)',
    footer: 'Thank you for contacting support. We appreciate your patience.',
    closeButton: 'Close',
    viewTickets: 'View My Tickets'
  },
  hi: {
    title: 'टिकट पुष्टिकरण',
    subtitle: 'आपकी सहायता टिकट सफलतापूर्वक बनाई गई है',
    ticketCreated: 'टिकट सफलतापूर्वक बनाई गई!',
    ticketNumber: 'टिकट संख्या',
    issueType: 'समस्या का प्रकार',
    description: 'समस्या विवरण',
    priority: 'प्राथमिकता',
    createdOn: 'निर्माण तिथि',
    whatNext: 'अब क्या होगा?',
    step1: 'हमारी सहायता टीम आपकी टिकट की समीक्षा करेगी',
    step2: 'हम आपके ईमेल पर अपडेट भेजेंगे',
    step3: 'आप "मेरे टिकट" में प्रगति ट्रैक कर सकते हैं',
    step4: 'औसत प्रतिक्रिया समय: 2-4 घंटे',
    estimatedResponse: 'अनुमानित प्रतिक्रिया समय',
    businessHours: '2-4 घंटे (व्यावसायिक घंटों के दौरान)',
    footer: 'समर्थन से संपर्क करने के लिए धन्यवाद। हम आपके धैर्य की सराहना करते हैं।',
    closeButton: 'बंद करें',
    viewTickets: 'मेरे टिकट देखें'
  },
  bn: {
    title: 'টিকিট নিশ্চিতকরণ',
    subtitle: 'আপনার সহায়তা টিকিট সফলভাবে তৈরি হয়েছে',
    ticketCreated: 'টিকিট সফলভাবে তৈরি হয়েছে!',
    ticketNumber: 'টিকিট নম্বর',
    issueType: 'সমস্যার ধরন',
    description: 'সমস্যার বিবরণ',
    priority: 'অগ্রাধিকার',
    createdOn: 'তৈরি হয়েছে',
    whatNext: 'এরপর কী হবে?',
    step1: 'আমাদের সহায়তা দল আপনার টিকিট পর্যালোচনা করবে',
    step2: 'আমরা আপনার ইমেলে আপডেট পাঠাব',
    step3: 'আপনি "আমার টিকিট"-এ অগ্রগতি ট্র্যাক করতে পারেন',
    step4: 'গড় প্রতিক্রিয়া সময়: 2-4 ঘণ্টা',
    estimatedResponse: 'আনুমানিক প্রতিক্রিয়া সময়',
    businessHours: '2-4 ঘণ্টা (ব্যবসায়িক সময়)',
    footer: 'সহায়তার সাথে যোগাযোগ করার জন্য ধন্যবাদ। আমরা আপনার ধৈর্যের প্রশংসা করি।',
    closeButton: 'বন্ধ করুন',
    viewTickets: 'আমার টিকিট দেখুন'
  },
  mr: {
    title: 'तिकीट पुष्टीकरण',
    subtitle: 'तुमचे सपोर्ट तिकीट यशस्वीरित्या तयार केले गेले आहे',
    ticketCreated: 'तिकीट यशस्वीरित्या तयार केले!',
    ticketNumber: 'तिकीट क्रमांक',
    issueType: 'समस्येचा प्रकार',
    description: 'समस्या वर्णन',
    priority: 'प्राधान्य',
    createdOn: 'तयार केले',
    whatNext: 'आता काय होईल?',
    step1: 'आमची सपोर्ट टीम तुमच्या तिकीटाचे पुनरावलोकन करेल',
    step2: 'आम्ही तुमच्या ईमेलवर अपडेट पाठवू',
    step3: 'तुम्ही "माझे तिकीट" मध्ये प्रगती ट्रॅक करू शकता',
    step4: 'सरासरी प्रतिसाद वेळ: 2-4 तास',
    estimatedResponse: 'अंदाजे प्रतिसाद वेळ',
    businessHours: '2-4 तास (व्यावसायिक वेळेत)',
    footer: 'सपोर्टशी संपर्क साधल्याबद्दल धन्यवाद. आम्ही तुमच्या धीराची प्रशंसा करतो।',
    closeButton: 'बंद करा',
    viewTickets: 'माझे तिकीट पहा'
  },
  es: {
    title: 'Confirmación de Ticket',
    subtitle: 'Su ticket de soporte ha sido creado exitosamente',
    ticketCreated: '¡Ticket Creado Exitosamente!',
    ticketNumber: 'Número de Ticket',
    issueType: 'Tipo de Problema',
    description: 'Descripción del Problema',
    priority: 'Prioridad',
    createdOn: 'Creado el',
    whatNext: '¿Qué sigue?',
    step1: 'Nuestro equipo revisará su ticket',
    step2: 'Enviaremos actualizaciones a su correo',
    step3: 'Puede seguir el progreso en "Mis Tickets"',
    step4: 'Tiempo promedio de respuesta: 2-4 horas',
    estimatedResponse: 'Tiempo Estimado de Respuesta',
    businessHours: '2-4 horas (horario comercial)',
    footer: 'Gracias por contactar al soporte. Apreciamos su paciencia.',
    closeButton: 'Cerrar',
    viewTickets: 'Ver Mis Tickets'
  },
  fr: {
    title: 'Confirmation de Ticket',
    subtitle: 'Votre ticket de support a été créé avec succès',
    ticketCreated: 'Ticket Créé avec Succès!',
    ticketNumber: 'Numéro de Ticket',
    issueType: 'Type de Problème',
    description: 'Description du Problème',
    priority: 'Priorité',
    createdOn: 'Créé le',
    whatNext: 'Que se passe-t-il ensuite?',
    step1: 'Notre équipe examinera votre ticket',
    step2: 'Nous enverrons des mises à jour à votre e-mail',
    step3: 'Vous pouvez suivre les progrès dans "Mes Tickets"',
    step4: 'Temps de réponse moyen: 2-4 heures',
    estimatedResponse: 'Temps de Réponse Estimé',
    businessHours: '2-4 heures (pendant les heures ouvrables)',
    footer: 'Merci d\'avoir contacté le support. Nous apprécions votre patience.',
    closeButton: 'Fermer',
    viewTickets: 'Voir Mes Tickets'
  },
  de: {
    title: 'Ticket-Bestätigung',
    subtitle: 'Ihr Support-Ticket wurde erfolgreich erstellt',
    ticketCreated: 'Ticket Erfolgreich Erstellt!',
    ticketNumber: 'Ticketnummer',
    issueType: 'Problemtyp',
    description: 'Problembeschreibung',
    priority: 'Priorität',
    createdOn: 'Erstellt am',
    whatNext: 'Was passiert als Nächstes?',
    step1: 'Unser Support-Team wird Ihr Ticket überprüfen',
    step2: 'Wir senden Updates an Ihre E-Mail',
    step3: 'Sie können den Fortschritt in "Meine Tickets" verfolgen',
    step4: 'Durchschnittliche Antwortzeit: 2-4 Stunden',
    estimatedResponse: 'Geschätzte Antwortzeit',
    businessHours: '2-4 Stunden (während der Geschäftszeiten)',
    footer: 'Vielen Dank für Ihre Kontaktaufnahme. Wir schätzen Ihre Geduld.',
    closeButton: 'Schließen',
    viewTickets: 'Meine Tickets Ansehen'
  },
  zh: {
    title: '工单确认',
    subtitle: '您的支持工单已成功创建',
    ticketCreated: '工单创建成功！',
    ticketNumber: '工单编号',
    issueType: '问题类型',
    description: '问题描述',
    priority: '优先级',
    createdOn: '创建时间',
    whatNext: '接下来会发生什么？',
    step1: '我们的支持团队将审核您的工单',
    step2: '我们会将更新发送到您的电子邮件',
    step3: '您可以在"我的工单"中跟踪进度',
    step4: '平均响应时间：2-4小时',
    estimatedResponse: '预计响应时间',
    businessHours: '2-4小时（工作时间内）',
    footer: '感谢您联系支持团队。我们感谢您的耐心。',
    closeButton: '关闭',
    viewTickets: '查看我的工单'
  },
  ja: {
    title: 'チケット確認',
    subtitle: 'サポートチケットが正常に作成されました',
    ticketCreated: 'チケット作成成功！',
    ticketNumber: 'チケット番号',
    issueType: '問題の種類',
    description: '問題の説明',
    priority: '優先度',
    createdOn: '作成日',
    whatNext: '次に何が起こりますか？',
    step1: 'サポートチームがチケットを確認します',
    step2: 'メールで更新情報をお送りします',
    step3: '「マイチケット」で進捗を追跡できます',
    step4: '平均応答時間：2〜4時間',
    estimatedResponse: '推定応答時間',
    businessHours: '2〜4時間（営業時間内）',
    footer: 'サポートへのお問い合わせありがとうございます。ご辛抱ください。',
    closeButton: '閉じる',
    viewTickets: 'マイチケットを見る'
  },
  pt: {
    title: 'Confirmação de Ticket',
    subtitle: 'Seu ticket de suporte foi criado com sucesso',
    ticketCreated: 'Ticket Criado com Sucesso!',
    ticketNumber: 'Número do Ticket',
    issueType: 'Tipo de Problema',
    description: 'Descrição do Problema',
    priority: 'Prioridade',
    createdOn: 'Criado em',
    whatNext: 'O que acontece a seguir?',
    step1: 'Nossa equipe revisará seu ticket',
    step2: 'Enviaremos atualizações para seu e-mail',
    step3: 'Você pode acompanhar o progresso em "Meus Tickets"',
    step4: 'Tempo médio de resposta: 2-4 horas',
    estimatedResponse: 'Tempo Estimado de Resposta',
    businessHours: '2-4 horas (durante horário comercial)',
    footer: 'Obrigado por entrar em contato com o suporte. Agradecemos sua paciência.',
    closeButton: 'Fechar',
    viewTickets: 'Ver Meus Tickets'
  },
  ar: {
    title: 'تأكيد التذكرة',
    subtitle: 'تم إنشاء تذكرة الدعم الخاصة بك بنجاح',
    ticketCreated: 'تم إنشاء التذكرة بنجاح!',
    ticketNumber: 'رقم التذكرة',
    issueType: 'نوع المشكلة',
    description: 'وصف المشكلة',
    priority: 'الأولوية',
    createdOn: 'تم الإنشاء في',
    whatNext: 'ماذا يحدث بعد ذلك؟',
    step1: 'سيقوم فريق الدعم لدينا بمراجعة تذكرتك',
    step2: 'سنرسل التحديثات إلى بريدك الإلكتروني',
    step3: 'يمكنك تتبع التقدم في "تذاكري"',
    step4: 'متوسط وقت الاستجابة: 2-4 ساعات',
    estimatedResponse: 'وقت الاستجابة المقدر',
    businessHours: '2-4 ساعات (خلال ساعات العمل)',
    footer: 'شكرا لاتصالك بالدعم. نحن نقدر صبرك.',
    closeButton: 'إغلاق',
    viewTickets: 'عرض تذاكري'
  },
  ru: {
    title: 'Подтверждение Заявки',
    subtitle: 'Ваша заявка в поддержку успешно создана',
    ticketCreated: 'Заявка Успешно Создана!',
    ticketNumber: 'Номер Заявки',
    issueType: 'Тип Проблемы',
    description: 'Описание Проблемы',
    priority: 'Приоритет',
    createdOn: 'Создано',
    whatNext: 'Что дальше?',
    step1: 'Наша команда поддержки рассмотрит вашу заявку',
    step2: 'Мы отправим обновления на вашу электронную почту',
    step3: 'Вы можете отслеживать прогресс в "Мои Заявки"',
    step4: 'Среднее время ответа: 2-4 часа',
    estimatedResponse: 'Ожидаемое Время Ответа',
    businessHours: '2-4 часа (в рабочее время)',
    footer: 'Спасибо за обращение в поддержку. Мы ценим ваше терпение.',
    closeButton: 'Закрыть',
    viewTickets: 'Просмотр Моих Заявок'
  }
};

export default function TicketConfirmation({ 
  ticketNumber, 
  issueType, 
  description, 
  priority,
  timestamp,
  onClose 
}: TicketConfirmationProps) {
  const lang = getCurrentLanguage() as keyof typeof TRANSLATIONS;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const getDateLocale = (lang: string) => {
    const localeMap: { [key: string]: string } = {
      en: 'en-US',
      hi: 'hi-IN',
      bn: 'bn-BD',
      mr: 'mr-IN',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      zh: 'zh-CN',
      ja: 'ja-JP',
      pt: 'pt-BR',
      ar: 'ar-SA',
      ru: 'ru-RU'
    };
    return localeMap[lang] || 'en-US';
  };

  const formattedDate = new Date(timestamp).toLocaleString(getDateLocale(lang), {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header with Success Icon */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">{t.ticketCreated}</h2>
          <p className="text-green-50">{t.subtitle}</p>
        </div>

        {/* Ticket Details Card */}
        <div className="p-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ticket Number */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Hash className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">{t.ticketNumber}</div>
                  <div className="text-lg font-bold text-gray-900">{ticketNumber}</div>
                </div>
              </div>

              {/* Created On */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">{t.createdOn}</div>
                  <div className="text-sm font-semibold text-gray-900">{formattedDate}</div>
                </div>
              </div>

              {/* Issue Type */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">{t.issueType}</div>
                  <div className="text-sm font-semibold text-gray-900 capitalize">{issueType}</div>
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">{t.priority}</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(priority)}`}>
                    {priority.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="text-xs font-medium text-gray-600 mb-2">{t.description}</div>
              <div className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-blue-100">
                {description}
              </div>
            </div>
          </div>

          {/* What's Next Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              {t.whatNext}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <p className="text-sm text-gray-700 pt-0.5">{t.step1}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <p className="text-sm text-gray-700 pt-0.5">{t.step2}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <p className="text-sm text-gray-700 pt-0.5">{t.step3}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                <p className="text-sm text-gray-700 pt-0.5">{t.step4}</p>
              </div>
            </div>

            {/* Response Time Box */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" />
                <div className="text-sm font-semibold">{t.estimatedResponse}</div>
              </div>
              <div className="text-lg font-bold">{t.businessHours}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4 italic">{t.footer}</p>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              {t.closeButton}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
