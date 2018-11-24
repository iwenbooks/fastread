import numpy as np
import os
import tensorflow as tf
from sklearn.metrics import f1_score,precision_score,recall_score
from .data_utils import minibatches, pad_sequences, get_chunks
from .general_utils import Progbar
from .base_model import BaseModel
ntags=2#记得改

class NERModel(BaseModel):
    """Specialized class of Model for NER"""

    def __init__(self, config):
        super(NERModel, self).__init__(config)
        self.idx_to_tag = {idx: tag for tag, idx in
                           self.config.vocab_tags.items()}


    def add_placeholders(self):
        """Define placeholders = entries to computational graph"""
        # shape = (batch size, max length of sentence in batch)
        self.word_ids = tf.placeholder(tf.int32, shape=[None, None],
                        name="word_ids")

        # shape = (batch size)
        self.sequence_lengths = tf.placeholder(tf.int32, shape=[None],
                        name="sequence_lengths")

        # self.mask_x=tf.placeholder(tf.)
        # shape = (batch size, max length of sentence, max length of word)
        # self.char_ids = tf.placeholder(tf.int32, shape=[None, None, None],
        #                 name="char_ids")

        # shape = (batch_size, max_length of sentence)
        # self.word_lengths = tf.placeholder(tf.int32, shape=[None, None],
        #                 name="word_lengths")

        # shape = (batch size)
        self.labels = tf.placeholder(tf.int32, shape=[None],
                        name="labels")

        # hyper parameters
        self.dropout = tf.placeholder(dtype=tf.float32, shape=[],
                        name="dropout")
        self.lr = tf.placeholder(dtype=tf.float32, shape=[],
                        name="lr")
        # self.mask_x = tf.placehol
        # der(tf.float32, [max(self.sequence_lengths), None], name="mask_x")

    def get_feed_dict(self, words, labels=None, lr=None, dropout=None):
        """Given some data, pad it and build a feed dictionary

        Args:
            words: list of sentences. A sentence is a list of ids of a list of
                words. A word is a list of ids
            labels: list of ids
            lr: (float) learning rate
            dropout: (float) keep prob

        Returns:
            dict {placeholder: value}

        """
        # perform padding of the given data
        # if self.config.use_chars:
        #     char_ids, word_ids = zip(*words)
        #     word_ids, sequence_lengths = pad_sequences(word_ids, 0)
        #     char_ids, word_lengths = pad_sequences(char_ids, pad_tok=0,
        #         nlevels=2)
        # else:
        word_ids, sequence_lengths = pad_sequences(words, 0)

        # build feed dictionary
        feed = {
            self.word_ids: word_ids,
            self.sequence_lengths: sequence_lengths
        }

        # if self.config.use_chars:
        #     feed[self.char_ids] = char_ids
        #     feed[self.word_lengths] = word_lengths

        if labels is not None:
        #     labels, _ = pad_sequences(labels, 0)

            feed[self.labels] = labels

        if lr is not None:
            feed[self.lr] = lr

        if dropout is not None:
            feed[self.dropout] = dropout

        return feed, sequence_lengths


    def add_word_embeddings_op(self):
        """Defines self.word_embeddings

        If self.config.embeddings is not None and is a np array initialized
        with pre-trained word vectors, the word embeddings is just a look-up
        and we don't train the vectors. Otherwise, a random matrix with
        the correct shape is initialized.
        """
        with tf.variable_scope("words"):
            if self.config.embeddings is None:
                self.logger.info("WARNING: randomly initializing word vectors")
                _word_embeddings = tf.get_variable(
                        name="_word_embeddings",
                        dtype=tf.float32,
                        shape=[self.config.nwords, self.config.dim_word])
            else:
                _word_embeddings = tf.Variable(
                        self.config.embeddings,
                        name="_word_embeddings",
                        dtype=tf.float32,
                        trainable=self.config.train_embeddings)
            #batch*句长*embedding
            word_embeddings = tf.nn.embedding_lookup(_word_embeddings,
                    self.word_ids, name="word_embeddings")

        # with tf.variable_scope("chars"):
        #     if self.config.use_chars:
        #         # get char embeddings matrix
        #         _char_embeddings = tf.get_variable(
        #                 name="_char_embeddings",
        #                 dtype=tf.float32,
        #                 shape=[self.config.nchars, self.config.dim_char])
        #         char_embeddings = tf.nn.embedding_lookup(_char_embeddings,
        #                 self.char_ids, name="char_embeddings")
        #
        #         # put the time dimension on axis=1
        #         s = tf.shape(char_embeddings)
        #         char_embeddings = tf.reshape(char_embeddings,
        #                 shape=[s[0]*s[1], s[-2], self.config.dim_char])
        #         word_lengths = tf.reshape(self.word_lengths, shape=[s[0]*s[1]])
        #
        #         # bi lstm on chars
        #         cell_fw = tf.contrib.rnn.LSTMCell(self.config.hidden_size_char,
        #                 state_is_tuple=True)
        #         cell_bw = tf.contrib.rnn.LSTMCell(self.config.hidden_size_char,
        #                 state_is_tuple=True)
        #         _output = tf.nn.bidirectional_dynamic_rnn(
        #                 cell_fw, cell_bw, char_embeddings,
        #                 sequence_length=word_lengths, dtype=tf.float32)
        #
        #         # read and concat output
        #         _, ((_, output_fw), (_, output_bw)) = _output
        #         output = tf.concat([output_fw, output_bw], axis=-1)
        #
        #         # shape = (batch size, max sentence length, char hidden size)
        #         output = tf.reshape(output,
        #                 shape=[s[0], s[1], 2*self.config.hidden_size_char])
        #         word_embeddings = tf.concat([word_embeddings, output], axis=-1)

        self.word_embeddings =  tf.nn.dropout(word_embeddings, self.dropout)

    def add_label_embeddings_op(self):
        #labels 为batch_size*1
        #label_onehot为
        self.label_onehot = tf.one_hot(self.labels, ntags, 1, 0,axis=-1)
        # print(self.labels)
        # print("****")
        # print(self.label_onehot)


    # def add_logits_op(self):
        """Defines self.logits

        For each word in each sentence of the batch, it corresponds to a vector
        of scores, of dimension equal to the number of tags.
        """
        # with tf.variable_scope("bi-lstm"):
        #     cell = tf.contrib.rnn.LSTMCell(self.config.hidden_size_lstm)
        #     # cell_fw = tf.contrib.rnn.LSTMCell(self.config.hidden_size_lstm)
        #     # cell_bw = tf.contrib.rnn.LSTMCell(self.config.hidden_size_lstm)
        #     # (output_fw, output_bw), _ = tf.nn.bidirectional_dynamic_rnn(
        #     #         cell_fw, cell_bw, self.word_embeddings,
        #     #         sequence_length=self.sequence_lengths, dtype=tf.float32)
        #     lstm_cell=tf.nn.rnn_cell.BasicLSTMCell(self.config.hidden_size_lstm,forget_bias=1,state_is_tuple=True)
        #     _init_state = lstm_cell.zero_state(self.config.batch_size,dtype=tf.float32)
        #     output,states=tf.nn.dynamic_rnn(lstm_cell,self.word_embeddings,sequence_length=self.sequence_lengths,initial_state=_init_state,time_major=False)
        #     # output = tf.concat([output_fw, output_bw], axis=-1)
        #     # output = tf.nn.dropout(output, self.dropout)
        #     nsteps = tf.shape(output)[1]
        # self.mask_x = tf.placeholder(tf.float32, [nsteps, None], name="mask_x")
        # output=output*self.mask_x[:,:,None]
        # with tf.name_scope("mean_pooling_layer"):
        #     output=tf.reduce_sum(output,0)/(tf.reduce_sum(self.mask_x,0)[:,None])
        # with tf.name_scope("Softmax_layer_and_output"):
        #     softmax_w = tf.get_variable("softmax_w",[self.confighidden_neural_size,self.config.ntags],dtype=tf.float32)
        #     softmax_b = tf.get_variable("softmax_b",[self.config.ntags],dtype=tf.float32)
        #     # self.logits = tf.matmul(out_put,softmax_w)
        #     # self.scores = tf.add(self.logits, softmax_b, name='scores')
        #     self.logits = tf.nn.xw_plus_b(output, softmax_w, softmax_b, name="scores")

        # with tf.variable_scope("proj"):
        #     W = tf.get_variable("W", dtype=tf.float32,
        #             shape=[self.config.hidden_size_lstm, self.config.ntags])
        #
        #     b = tf.get_variable("b", shape=[self.config.ntags],
        #             dtype=tf.float32, initializer=tf.zeros_initializer())

            # nsteps = tf.shape(output)[1]
            # output = tf.reshape(output, [-1, self.config.hidden_size_lstm])
            # pred = tf.matmul(output, W) + b
            # self.logits = tf.reshape(pred, [-1, nsteps, self.config.ntags])


    # def add_pred_op(self):
        """Defines self.labels_pred

        This op is defined only in the case where we don't use a CRF since in
        that case we can make the prediction "in the graph" (thanks to tf
        functions in other words). With theCRF, as the inference is coded
        in python and not in pure tensroflow, we have to make the prediciton
        outside the graph.
        """
        # if not self.config.use_crf:
        #     self.labels_pred = tf.cast(tf.argmax(self.logits, axis=-1),
        #             tf.int32)


    # def add_loss_op(self):
        """Defines the loss"""
        # if self.config.use_crf:
        #     log_likelihood, trans_params = tf.contrib.crf.crf_log_likelihood(
        #             self.logits, self.labels, self.sequence_lengths)
        #     self.trans_params = trans_params # need to evaluate it for decoding
        #     self.loss = tf.reduce_mean(-log_likelihood)
        # else:
        #     losses = tf.nn.sparse_softmax_cross_entropy_with_logits(
        #             logits=self.logits, labels=self.labels)
        #     mask = tf.sequence_mask(self.sequence_lengths)
        #     losses = tf.boolean_mask(losses, mask)
        #     self.loss = tf.reduce_mean(losses)
        # with tf.name_scope("loss"):
        #     self.loss = tf.nn.softmax_cross_entropy_with_logits(labels=self.labels, logits=self.logits + 1e-10)
        #     self.cost = tf.reduce_mean(self.loss)
        #     # add summary
        # loss_summary = tf.summary.scalar("loss", self.cost)
        # # for tensorboard
        # # tf.summary.scalar("loss", self.loss)
        # with tf.name_scope("accuracy"):
        #     self.prediction = tf.argmax(self.labels, 1, name="prediction")
        #     correct_prediction = tf.equal(self.prediction, tf.argmax(self.labels, 1))
        #     self.correct_num = tf.reduce_sum(tf.cast(correct_prediction, tf.float32))
        #     self.accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32), name="accuracy")
        #     self.probability = tf.nn.softmax(self.logits, name="probability")
        # # add summary
        # accuracy_summary = tf.summary.scalar("accuracy_summary", self.accuracy)


    def build(self):
        # NER specific functions
        self.add_placeholders()
        self.add_word_embeddings_op()
        self.add_label_embeddings_op()


        # self.add_logits_op()
        with tf.variable_scope("bi-lstm"):
            cell = tf.contrib.rnn.LSTMCell(self.config.hidden_size_lstm)
            # cell_fw = tf.contrib.rnn.LSTMCell(self.config.hidden_size_lstm)
            # cell_bw = tf.contrib.rnn.LSTMCell(self.config.hidden_size_lstm)
            # (output_fw, output_bw), _ = tf.nn.bidirectional_dynamic_rnn(
            #         cell_fw, cell_bw, self.word_embeddings,
            #         sequence_length=self.sequence_lengths, dtype=tf.float32)
            lstm_cell=tf.nn.rnn_cell.LSTMCell(self.config.hidden_size_lstm,forget_bias=1,state_is_tuple=True)
            _init_state = lstm_cell.zero_state(self.config.batch_size,dtype=tf.float32)
            output,states=tf.nn.dynamic_rnn(lstm_cell,self.word_embeddings,sequence_length=self.sequence_lengths,initial_state=_init_state,time_major=False)
            #print(output)
            #output 形状为：20*？*100

            # output = tf.concat([output_fw, output_bw], axis=-1)
            # output = tf.nn.dropout(output, self.dropout)
            # nsteps = tf.shape(output)[1]
        # mask_x = tf.sequence_mask( self.sequence_lengths,max(self.sequence_lengths),tf.float32 ,name="mask_x")

        # output=output*mask_x[:,:,None]
        #有问题！
        with tf.name_scope("mean_pooling_layer"):
            nsteps = tf.shape(output)[1]
            # shape1 = tf.shape(output)[0]
            # shape3 = tf.shape(output)[2]
            # print(nsteps)

            # output1 = tf.get_variable("output1",shape=[shape1,1,shape3],dtype=tf.float32)
            # for j in range(nsteps):
                # output1+=output[:,j,:]
            # output=output1.reshape(tf.shape(output)[0],tf.shape(output)[2])
            # output=np.sum(output,nsteps)
            mask=tf.sequence_mask(self.sequence_lengths,maxlen=nsteps,dtype=tf.float32)
            # print(mask)
            # print(tf.reduce_sum(mask,1)[None,:,None])

            output=tf.reduce_sum(output,1)/(tf.reduce_sum(mask,1)[:,None])
            # print(output)
            # print(np.shape(output))

            # for index, i in enumerate(self.sequence_lengths):
            #     output[index,:]=np.divide(output[index,:],i)
            # print(np.shape(output))
            # exit()
        with tf.name_scope("Softmax_layer_and_output"):
            # softmax_w = tf.get_variable("softmax_w",[self.config.hidden_neural_size,self.config.ntags],dtype=tf.float32)
            # softmax_b = tf.get_variable("softmax_b",[self.config.ntags],dtype=tf.float32)
            W = tf.get_variable("W", dtype=tf.float32,
                        shape=[self.config.hidden_size_lstm, self.config.ntags])

            b = tf.get_variable("b", shape=[self.config.ntags],
                        dtype=tf.float32, initializer=tf.zeros_initializer())
            # self.logits = tf.matmul(out_put,softmax_w)
            # self.scores = tf.add(self.logits, softmax_b, name='scores')
            # self.logits = tf.nn.xw_plus_b(output, W, b, name="scores")
            nsteps = tf.shape(output)[1]
            output = tf.reshape(output, [-1, self.config.hidden_size_lstm])
            pred = tf.nn.softmax(tf.add(tf.matmul(output, W) , b))
            #print(pred)
            # print(np.shape(pred))
            # self.logits = tf.reshape(pred, [-1, nsteps, self.config.ntags])
            self.logits=pred

        # self.add_pred_op()
        # self.add_loss_op()

        with tf.name_scope("loss"):
            losses = tf.nn.softmax_cross_entropy_with_logits(labels=self.label_onehot, logits=self.logits)
            self.loss = tf.reduce_mean(losses)
            # add summary
        loss_summary = tf.summary.scalar("loss", self.loss)
        # for tensorboard
        # tf.summary.scalar("loss", self.loss)
        with tf.name_scope("accuracy"):
            self.prediction = tf.argmax(self.logits, 1, name="prediction")
            correct_prediction = tf.equal(self.prediction, tf.argmax(self.label_onehot, 1))
            self.correct_num = tf.reduce_sum(tf.cast(correct_prediction, tf.float32))
            self.accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32), name="accuracy")
            self.probability = tf.nn.softmax(self.logits, name="probability")
        # add summary
        accuracy_summary = tf.summary.scalar("accuracy_summary", self.accuracy)



        # Generic functions that add training op and initialize session
        self.add_train_op(self.config.lr_method, self.lr, self.loss,
                self.config.clip)
        self.initialize_session() # now self.sess is defined and vars are init


    def predict_batch(self, words):
        """
        Args:
            words: list of sentences

        Returns:
            labels_pred: list of labels for each sentence
            sequence_length

        """
        fd, sequence_lengths = self.get_feed_dict(words, dropout=1.0)

        # if self.config.use_crf:
        #     # get tag scores and transition params of CRF
        #     viterbi_sequences = []
        #     logits, trans_params = self.sess.run(
        #             [self.logits, self.trans_params], feed_dict=fd)
        #
        #     # iterate over the sentences because no batching in vitervi_decode
        #     for logit, sequence_length in zip(logits, sequence_lengths):
        #         logit = logit[:sequence_length] # keep only the valid steps
        #         viterbi_seq, viterbi_score = tf.contrib.crf.viterbi_decode(
        #                 logit, trans_params)
        #         viterbi_sequences += [viterbi_seq]
        #
        #     return viterbi_sequences, sequence_lengths
        #
        # else:
        labels_pred = self.sess.run(self.logits, feed_dict=fd)
        # print("labels_pred")
        # print(labels_pred)
        return labels_pred


    def run_epoch(self, train, dev, epoch):
        """Performs one complete pass over the train set and evaluate on dev

        Args:
            train: dataset that yields tuple of sentences, tags
            dev: dataset
            epoch: (int) index of the current epoch

        Returns:
            f1: (python float), score to select model on, higher is better

        """
        # progbar stuff for logging
        batch_size = self.config.batch_size
        nbatches = (len(train) + batch_size - 1) // batch_size
        prog = Progbar(target=nbatches)


        # lossfile=open()
        # iterate over dataset
        for i, (words, labels) in enumerate(minibatches(train, batch_size)):
            fd, _ = self.get_feed_dict(words, labels, self.config.lr,
                    self.config.dropout)
            # print(np.shape(fd[self.word_ids]))
            # print(np.shape(fd[self.sequence_lengths]))
            # print(np.shape(fd[self.labels]))
            # print(np.shape(fd[self.lr]))
            # print(np.shape(fd[self.dropout]))


            # exit()

            _, train_loss, summary = self.sess.run(
                    [self.train_op, self.loss, self.merged], feed_dict=fd)

            prog.update(i + 1, [("train loss", train_loss)])

            # tensorboard
            if i % 10 == 0:
                self.file_writer.add_summary(summary, epoch*nbatches + i)

        metric = self.run_evaluate(dev,Flag=False)
        msg = "{}".format(metric)
        self.logger.info(msg)

        return metric['f1_macro']


    def run_evaluate(self, test,Flag=False):
        """Evaluates performance on test set

        Args:
            test: dataset that yields tuple of (sentences, tags)
            Flag:True--evaluate\False--dev

        Returns:
            metrics: (dict) metrics["acc"] = 98.4, ...

        """
        accs = 0
        total=0
        truelist=[]
        predlist=[]
        if(Flag==True):
            output=open('I:\\phd研究\\项目\\Didi\\question_detection_test\\withoutQuestionMark\\char\\ALLResult.txt','a+',encoding='utf-8')
            output.write("预测" + '\t' + "类别" + '\t' + '语句' + '\n')
            # correct_preds, total_correct, total_preds = 0., 0., 0.
        for words, labels in minibatches(test, self.config.batch_size):
                #labels维度为(batch_size)
            #labels_pred维度为(batchsize*num_tags)

            # self.prediction = tf.argmax(self.logits, 1, name="prediction")
            # correct_prediction = tf.equal(self.prediction, tf.argmax(self.label_onehot, 1))
            # self.correct_num = tf.reduce_sum(tf.cast(correct_prediction, tf.float32))
            # self.accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32), name="accuracy")
            # self.probability = tf.nn.softmax(self.logits, name="probability")

            labels_pred = self.predict_batch(words)
            pred=np.argmax(labels_pred,1)
            total+=1
            if pred==labels:
                accs+=1

            # print(words)
            # print(labels)
            # print(pred)
            # else:
            #     output.write(pred+'\t'+labels+'\t'+words+'\n')
            # accs.append(self.accuracy)
            # print("labels_pred***")
            # print(labels_pred)
            # print(labels)

            idx_to_tag = {idx: tag for tag, idx in self.config.vocab_tags.items()}
            truelist.append(labels[0])
            predlist.append(pred[0])

            if(Flag==True):
                # if idx_to_tag[pred[0]]!=idx_to_tag[labels[0]]:
                output.write(idx_to_tag[pred[0]]+'\t')
                output.write(idx_to_tag[labels[0]]+'\t')

                idx_to_word = {idx: word for word, idx in self.config.vocab_words.items()}

                for word in words[0]:
                    output.write(idx_to_word[word])
                output.write('\n')


            # for lab, lab_pred in zip(labels, labels_pred):
            #     total_preds+=1



                # lab_chunks      = set(get_chunks(lab, self.config.vocab_tags))
                # lab_pred_chunks = set(get_chunks(lab_pred,
                #                                  self.config.vocab_tags))

                # correct_preds += len(lab_chunks & lab_pred_chunks)
                # total_preds   += len(lab_pred_chunks)
                # total_correct += len(lab_chunks)

        # p   = correct_preds / total_preds if correct_preds > 0 else 0
        # r   = correct_preds / total_correct if correct_preds > 0 else 0
        # f1  = 2 * p * r / (p + r) if correct_preds > 0 else 0
        # print(accs)
        f1_all=f1_score(truelist, predlist, average=None)
        f1_macro=f1_score(truelist, predlist, average='macro')
        f1_micro=f1_score(truelist, predlist, average='micro')
        acc = accs/total

        return {"acc":100*acc,"f1_macro":100*f1_macro,"f1_micro":100*f1_micro}
        # return {"acc": 100*acc, "f1": 100*f1}


    def predict(self, words_raw):
        """Returns list of tags

        Args:
            words_raw: list of words (string), just one sentence (no batch)

        Returns:
            preds: list of tags (string), one for each word in the sentence

        """
        words = [self.config.processing_word(w) for w in words_raw]
        if type(words[0]) == tuple:
            words = zip(*words)
        pred_ids= self.predict_batch([words])
        pred_ids = np.argmax(pred_ids, -1)[0]
        preds = [self.idx_to_tag[pred_ids]]
        return preds
